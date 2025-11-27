import os
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv
import sys
import site
from pathlib import Path
import os


env_path = Path(__file__).resolve().parents[2] / ".env"


# Add utils directory to path for local imports
utils_dir = str(Path(__file__).parent)
if utils_dir not in sys.path:
    sys.path.insert(0, utils_dir)

# Ensure user site-packages is in path (fixes module import issues)
user_site = site.getusersitepackages()
if user_site not in sys.path:
    sys.path.insert(0, user_site)


load_dotenv(dotenv_path=env_path)
API_KEY = os.getenv("ADMIN_KEY")
ORG_ID = os.getenv("OPENAI_ORG_ID")  # optional

HEADERS = {
    "Authorization": f"Bearer {API_KEY}"
}
if ORG_ID:
    HEADERS["OpenAI-Organization"] = ORG_ID

BASE = "https://api.openai.com/v1"


def fetch_all_pages(url, params=None):
    """Fetch all pages from a paginated OpenAI API endpoint."""
    all_data = []
    next_page = None
    while True:
        req_params = dict(params or {})
        if next_page:
            req_params["page"] = next_page
        resp = requests.get(url, headers=HEADERS, params=req_params)
        resp.raise_for_status()
        data = resp.json()
        all_data.extend(data.get("data", []))
        if not data.get("has_more"):
            break
        next_page = data.get("next_page")
    return all_data


def aggregate_usage(usage_data):
    total_input = 0
    total_output = 0
    for bucket in usage_data:
        for result in bucket.get("results", []):
            total_input += result.get("input_tokens", 0)
            total_output += result.get("output_tokens", 0)
    return total_input, total_output


def aggregate_costs(cost_data):
    total_cost = 0.0
    for bucket in cost_data:
        for result in bucket.get("results", []):
            amount = result.get("amount", {}).get("value", 0.0)
            total_cost += amount
    return total_cost


if __name__ == "__main__":
    # Example: last 7 days
    end = datetime.utcnow()
    start = end - timedelta(days=7)

    usage_url = f"{BASE}/organization/usage/completions"
    costs_url = f"{BASE}/organization/costs"

    params = {
        "start_time": int(start.timestamp()),
        "end_time": int(end.timestamp()),
        "interval": "1d"
    }

    # Fetch and aggregate usage
    try:
        usage_data = fetch_all_pages(usage_url, params)
        total_input_tokens, total_output_tokens = aggregate_usage(usage_data)
        print(f"Total input tokens: {total_input_tokens}")
        print(f"Total output tokens: {total_output_tokens}")
    except Exception as e:
        print("Error fetching usage data:", e)

    # Fetch and aggregate costs
    try:
        costs_data = fetch_all_pages(costs_url, params)
        total_cost_usd = aggregate_costs(costs_data)
        print(f"Total estimated cost: ${total_cost_usd:.6f}")
    except Exception as e:
        print("Error fetching costs data:", e)
