import sys
sys.path.insert(0, 'data-echo/backend')
from verification_engine import verify_information_claim

test_claims = [
    ("Government announces new scholarship for college students", "Supported", 80.0, 100.0),
    ("Government issues official notification on PM scholarship scheme", "Supported", 80.0, 100.0),
    ("Massive earthquake in Pune magnitude 8.5 destroys city center", "Contradicted", 0.0, 20.0),
    ("RBI cancels all 500 rupee currency notes starting midnight", "Contradicted", 0.0, 20.0),
    ("India wins ICC Cricket World Cup", "Supported", 70.0, 100.0),
    ("Unknown extraterrestrial spaceship landed in downtown garden", "Unverified", 15.0, 35.0),
]

all_passed = True
print("=" * 70)
print("RUNNING RIGOROUS FACTUAL VERIFICATION TEST SUITE")
print("=" * 70)

for claim, expected_verdict, min_score, max_score in test_claims:
    res = verify_information_claim(claim)
    v = res["verdict"]
    score = res["truth_score"]
    badge = res["verdict_badge"]
    passed = (v == expected_verdict) and (min_score <= score <= max_score)
    if not passed:
        all_passed = False
    status_str = "PASS" if passed else "FAIL"
    print(f"[{status_str}] Claim: {claim[:50]}...")
    print(f"       Expected: {expected_verdict} ({min_score}-{max_score}%) | Got: {v} ({score}%) | Badge: {badge}")
    print(f"       Factor Breakdown: {res.get('factor_breakdown')}")
    print(f"       Earliest Source: {res.get('source_audit', {}).get('earliest_source')}")
    print(f"       Social Spreaders Count: {len(res.get('social_spreaders', []))}")
    print("-" * 70)

print(f"OVERALL STATUS: {'ALL TESTS PASSED WITH 100% PRECISION!' if all_passed else 'SOME TESTS FAILED'}")
assert all_passed, "Factual verification suite failed validation!"
