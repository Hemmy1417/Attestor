"""
Direct-mode tests for attestor.py — the deterministic surface of the
contract without GenLayer's AI/consensus/vision stack. Run with:
    python -m pytest tests/direct -q

The genlayer runtime is stubbed. The vision pipeline is exercised by
priming gl.eq_principle.prompt_non_comparative with a canned ruling (and
running its input builder, which calls the stubbed web.render/exec_prompt),
so the escrow bookkeeping around every ruling — payouts, attempt caps,
resubmits, refunds, open-vs-assigned bounties — is proven deterministically.
"""

import importlib.util
import json
import pathlib
import sys
import types
import pytest


CONTRACT_PATH = pathlib.Path(__file__).resolve().parents[2] / "contracts" / "attestor.py"


# ── GenLayer runtime stubs ───────────────────────────────────────────────────

class _UserError(Exception):
    pass


class _VmModule:
    UserError = _UserError


class _TreeMap(dict):
    def get(self, k, default=None):
        return super().get(k, default)


class _U256(int):
    def __new__(cls, v):
        return super().__new__(cls, int(v))


class _PublicViewDeco:
    def __call__(self, fn):
        return fn


class _PublicWriteDeco:
    payable = staticmethod(lambda fn: fn)

    def __call__(self, fn):
        return fn


class _Public:
    view = _PublicViewDeco()
    write = _PublicWriteDeco()


class _FakeEmit:
    def __init__(self):
        self.transfers = []   # (to, value, on)

    def total_to(self, addr):
        return sum(v for (t, v, _) in self.transfers if t.lower() == addr.lower())


class _EqPrinciple:
    canned_output = "{}"
    last_input = None

    @classmethod
    def prompt_non_comparative(cls, fn, task=None, criteria=None):
        # Run the input builder like the principle would, exercising the
        # screenshot + analyst path inside it.
        cls.last_input = fn()
        return cls.canned_output


class _NondetWeb:
    @staticmethod
    def render(url, mode="text"):
        if "dead" in url:
            raise RuntimeError("404 not found")
        return f"<screenshot bytes for {url} mode={mode}>"


class _Nondet:
    web = _NondetWeb()

    @staticmethod
    def exec_prompt(prompt, images=None):
        n = len(images) if images else 0
        return f"objective description of {n} image(s)"


class _Evm:
    @staticmethod
    def contract_interface(cls):
        class _Proxy:
            def __init__(self, addr):
                self._addr = str(addr)

            def emit_transfer(self, value, on=None):
                _GL._emit.transfers.append((self._addr, int(value), on))
        return _Proxy


class _GL:
    class Contract:
        pass

    evm = _Evm()
    public = _Public()
    vm = _VmModule
    eq_principle = _EqPrinciple
    nondet = _Nondet()

    class message:
        sender_address = "0x0000000000000000000000000000000000000000"
        value = 0

    _emit = None


def _install_stub():
    mod = types.ModuleType("genlayer")
    mod.gl = _GL
    mod.TreeMap = _TreeMap
    mod.u256 = _U256
    mod.Address = lambda x: x
    mod.__all__ = ["gl", "TreeMap", "u256", "Address"]
    sys.modules["genlayer"] = mod


_install_stub()


def _load_contract():
    spec = importlib.util.spec_from_file_location("attestor_contract", CONTRACT_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


# ── Fixtures + helpers ───────────────────────────────────────────────────────

CLIENT = "0xccc1111111111111111111111111111111111111"
WORKER = "0xaaa2222222222222222222222222222222222222"
OTHER  = "0xbbb3333333333333333333333333333333333333"

GEN = 10 ** 18
BOUNTY = GEN // 2    # 0.5 GEN
URL = "https://img.example.com/proof.png"


@pytest.fixture
def module():
    m = _load_contract()
    m.gl._emit = _FakeEmit()
    return m


def _as(m, addr, value=0):
    m.gl.message.sender_address = addr
    m.gl.message.value = value


def _post(m, c, worker="", attempts=3, bounty=BOUNTY):
    _as(m, CLIENT, bounty)
    return c.post_job("Install the panel", "Install the wall panel per the attached spec.",
                      "A photo showing the panel mounted flush on the wall with all four bolts visible.",
                      worker, attempts)


def _rule(verdict, confidence=90, reasoning="clear"):
    return json.dumps({"verdict": verdict, "confidence": confidence, "reasoning": reasoning})


# ── Posting jobs ─────────────────────────────────────────────────────────────

def test_post_job_happy_path(module):
    c = module.Attestor()
    job = _post(module, c, worker=WORKER)
    assert job["status"] == "OPEN"
    assert job["bounty_wei"] == str(BOUNTY)
    assert job["worker"] == WORKER
    assert job["max_attempts"] == 3
    assert c.get_protocol_stats()["total_bounty_volume_wei"] == str(BOUNTY)


def test_post_job_open_bounty(module):
    c = module.Attestor()
    job = _post(module, c, worker="")
    assert job["worker"] == ""


def test_post_job_rejects_underfunded(module):
    c = module.Attestor()
    _as(module, CLIENT, 10 ** 16)  # 0.01 GEN
    with pytest.raises(module.gl.vm.UserError, match="at least"):
        c.post_job("t", "a brief long enough to pass", "criteria long enough to pass", WORKER, 3)


def test_post_job_rejects_bad_attempts(module):
    c = module.Attestor()
    _as(module, CLIENT, BOUNTY)
    with pytest.raises(module.gl.vm.UserError, match="max_attempts"):
        c.post_job("title", "a brief long enough to pass", "criteria long enough to pass", WORKER, 9)


def test_post_job_rejects_malformed_worker(module):
    c = module.Attestor()
    _as(module, CLIENT, BOUNTY)
    with pytest.raises(module.gl.vm.UserError, match="worker_address"):
        c.post_job("title", "a brief long enough to pass", "criteria long enough to pass", "0xabc", 3)


# ── Verified proof pays the worker ───────────────────────────────────────────

def test_verified_proof_pays_worker(module):
    c = module.Attestor()
    job = _post(module, c, worker=WORKER)
    module.gl.eq_principle.canned_output = _rule("VERIFIED")
    _as(module, WORKER, 0)
    out = c.submit_proof(job["job_id"], URL, "all four bolts visible")
    assert out["verdict"] == "VERIFIED"
    assert out["job_status"] == "SETTLED"
    assert module.gl._emit.total_to(WORKER) == BOUNTY
    j = c.get_job(job["job_id"])
    assert j["status"] == "SETTLED" and j["settled_to"] == WORKER
    assert c.get_protocol_stats()["total_paid_wei"] == str(BOUNTY)


def test_screenshot_path_runs(module):
    c = module.Attestor()
    job = _post(module, c, worker=WORKER)
    module.gl.eq_principle.canned_output = _rule("VERIFIED")
    _as(module, WORKER, 0)
    c.submit_proof(job["job_id"], URL, "note")
    # The analyst description built from the screenshot reached the panel input.
    assert "IMAGE_DESCRIPTION" in module.gl.eq_principle.last_input
    assert "objective description of 1 image" in module.gl.eq_principle.last_input


def test_dead_image_url_rejects_cleanly(module):
    c = module.Attestor()
    job = _post(module, c, worker=WORKER)
    module.gl.eq_principle.canned_output = _rule("REJECTED", reasoning="unreadable")
    _as(module, WORKER, 0)
    out = c.submit_proof(job["job_id"], "https://dead.example.com/x.png", "note")
    assert out["verdict"] == "REJECTED"
    assert "UNREADABLE" in module.gl.eq_principle.last_input
    assert module.gl._emit.total_to(WORKER) == 0


# ── Rejections, attempts, resubmits ──────────────────────────────────────────

def test_rejected_proof_consumes_attempt_no_pay(module):
    c = module.Attestor()
    job = _post(module, c, worker=WORKER, attempts=3)
    module.gl.eq_principle.canned_output = _rule("REJECTED")
    _as(module, WORKER, 0)
    out = c.submit_proof(job["job_id"], URL, "note")
    assert out["job_status"] == "OPEN"
    assert out["attempts_left"] == 2
    assert module.gl._emit.total_to(WORKER) == 0
    assert c.get_job(job["job_id"])["attempts"] == 1


def test_resubmit_after_rejection_then_verify(module):
    c = module.Attestor()
    job = _post(module, c, worker=WORKER, attempts=3)
    _as(module, WORKER, 0)
    module.gl.eq_principle.canned_output = _rule("REJECTED")
    c.submit_proof(job["job_id"], URL, "blurry")
    module.gl.eq_principle.canned_output = _rule("VERIFIED")
    out = c.submit_proof(job["job_id"], URL, "sharper photo")
    assert out["verdict"] == "VERIFIED"
    assert module.gl._emit.total_to(WORKER) == BOUNTY
    assert len(c.get_proofs(job["job_id"])) == 2


def test_attempts_exhausted_blocks_submit(module):
    c = module.Attestor()
    job = _post(module, c, worker=WORKER, attempts=1)
    module.gl.eq_principle.canned_output = _rule("REJECTED")
    _as(module, WORKER, 0)
    c.submit_proof(job["job_id"], URL, "note")
    with pytest.raises(module.gl.vm.UserError, match="No attempts remaining"):
        c.submit_proof(job["job_id"], URL, "note")


# ── Authorization guards ─────────────────────────────────────────────────────

def test_wrong_worker_rejected(module):
    c = module.Attestor()
    job = _post(module, c, worker=WORKER)
    module.gl.eq_principle.canned_output = _rule("VERIFIED")
    _as(module, OTHER, 0)
    with pytest.raises(module.gl.vm.UserError, match="different worker"):
        c.submit_proof(job["job_id"], URL, "note")


def test_client_cannot_submit_own_job(module):
    c = module.Attestor()
    job = _post(module, c, worker="")   # open bounty
    module.gl.eq_principle.canned_output = _rule("VERIFIED")
    _as(module, CLIENT, 0)
    with pytest.raises(module.gl.vm.UserError, match="client cannot submit"):
        c.submit_proof(job["job_id"], URL, "note")


def test_open_bounty_anyone_can_win(module):
    c = module.Attestor()
    job = _post(module, c, worker="")
    module.gl.eq_principle.canned_output = _rule("VERIFIED")
    _as(module, OTHER, 0)
    out = c.submit_proof(job["job_id"], URL, "note")
    assert out["verdict"] == "VERIFIED"
    assert module.gl._emit.total_to(OTHER) == BOUNTY
    assert c.get_jobs_by_worker(OTHER)[0]["job_id"] == job["job_id"]


def test_no_submit_after_settled(module):
    c = module.Attestor()
    job = _post(module, c, worker=WORKER)
    module.gl.eq_principle.canned_output = _rule("VERIFIED")
    _as(module, WORKER, 0)
    c.submit_proof(job["job_id"], URL, "note")
    with pytest.raises(module.gl.vm.UserError, match="not open"):
        c.submit_proof(job["job_id"], URL, "note")


# ── Cancel / refund ──────────────────────────────────────────────────────────

def test_cancel_refunds_client(module):
    c = module.Attestor()
    job = _post(module, c, worker=WORKER)
    _as(module, CLIENT, 0)
    c.cancel_job(job["job_id"])
    assert module.gl._emit.total_to(CLIENT) == BOUNTY
    assert c.get_job(job["job_id"])["status"] == "CANCELLED"
    assert c.get_protocol_stats()["total_refunded_wei"] == str(BOUNTY)


def test_cancel_only_client(module):
    c = module.Attestor()
    job = _post(module, c, worker=WORKER)
    _as(module, WORKER, 0)
    with pytest.raises(module.gl.vm.UserError, match="Only the client"):
        c.cancel_job(job["job_id"])


def test_cancel_after_exhausted_attempts(module):
    c = module.Attestor()
    job = _post(module, c, worker=WORKER, attempts=1)
    module.gl.eq_principle.canned_output = _rule("REJECTED")
    _as(module, WORKER, 0)
    c.submit_proof(job["job_id"], URL, "note")
    _as(module, CLIENT, 0)
    c.cancel_job(job["job_id"])
    assert module.gl._emit.total_to(CLIENT) == BOUNTY


def test_cannot_cancel_settled(module):
    c = module.Attestor()
    job = _post(module, c, worker=WORKER)
    module.gl.eq_principle.canned_output = _rule("VERIFIED")
    _as(module, WORKER, 0)
    c.submit_proof(job["job_id"], URL, "note")
    _as(module, CLIENT, 0)
    with pytest.raises(module.gl.vm.UserError, match="not open"):
        c.cancel_job(job["job_id"])


# ── Conservation ─────────────────────────────────────────────────────────────

def test_bounty_conservation_paid(module):
    c = module.Attestor()
    job = _post(module, c, worker=WORKER)
    module.gl.eq_principle.canned_output = _rule("VERIFIED")
    _as(module, WORKER, 0)
    c.submit_proof(job["job_id"], URL, "note")
    total_out = sum(v for (_, v, _) in module.gl._emit.transfers)
    assert total_out == BOUNTY


def test_bounty_conservation_refunded(module):
    c = module.Attestor()
    job = _post(module, c, worker=WORKER)
    _as(module, CLIENT, 0)
    c.cancel_job(job["job_id"])
    total_out = sum(v for (_, v, _) in module.gl._emit.transfers)
    assert total_out == BOUNTY
