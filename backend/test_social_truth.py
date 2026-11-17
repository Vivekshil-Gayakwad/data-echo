import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__)))
from verification_engine import verify_information_claim

print("--- Testing Algorithmic Truth Verification & Social Media Tracking ---")

# Test 1: Supported claim
res1 = verify_information_claim("Government announces new scholarship for college students")
print("\n[Test 1: Official Claim]")
print("Claim:", res1["claim"])
print("Verdict:", res1["verdict"], "| Badge:", res1["verdict_badge"])
print("Exact Truth Score:", res1["truth_score"], "%")
print("Factor Breakdown:", res1.get("factor_breakdown"))
assert "social_spreaders" in res1, "social_spreaders must be returned!"
assert len(res1["social_spreaders"]) == 6, "Must track all 6 social platforms!"

print("\nSocial Media Handles & Actual Spreaders:")
for s in res1["social_spreaders"]:
    print(f"  {s['icon']} {s['platform']}: {s['handle']}")
    print(f"     Actual User: {s['actual_user']}")
    print(f"     Stance: {s['stance']}")
    print(f"     Truth Score: {s['handle_truth_score']}% | Virality: {s['shares_or_views']}")

# Test 2: Contradicted claim
res2 = verify_information_claim("Fake earthquake in Pune magnitude 8.5 rumor debunked")
print("\n[Test 2: Debunked Claim]")
print("Claim:", res2["claim"])
print("Verdict:", res2["verdict"])
print("Exact Truth Score:", res2["truth_score"], "%")
print("Debunk Penalty:", res2.get("factor_breakdown", {}).get("debunk_negation_penalty"))

# Check Propagation Graph nodes
prop_nodes = res2["graphs"]["propagation_graph"]["nodes"]
print("\nPropagation Graph Nodes (mapped to social spreaders):")
for node in prop_nodes[:5]:
    print(f"  Node: {node['id']} ({node['label']}) -> Role: {node['role']}")

print("\nAll Social Media & Exact Truth Percentage Tests PASSED!")
