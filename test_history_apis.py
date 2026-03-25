import requests
import sys
from datetime import datetime

class HistoryAPITester:
    def __init__(self, base_url="https://981d5552-e907-49f6-a000-953b349b48f4.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_login(self, email, password):
        """Test login and get token"""
        success, response = self.run_test(
            "Login",
            "POST",
            "api/auth/login",
            200,
            data={"email": email, "password": password}
        )
        if success and 'token' in response:
            self.token = response['token']
            return True
        return False

    def test_save_fuel_surcharge(self):
        """Test saving fuel surcharge calculation"""
        data = {
            "current_fuel_price": 4.25,
            "base_fuel_price": 2.50,
            "base_rate": 2500.00,
            "miles": 500,
            "surcharge_method": "percentage",
            "surcharge_percent": 70.0,
            "surcharge_amount": 1750.0,
            "total_with_surcharge": 4250.0,
            "cpm_surcharge": 0.292
        }
        success, response = self.run_test(
            "Save Fuel Surcharge",
            "POST",
            "api/history/fuel-surcharge",
            200,
            data=data
        )
        return success, response

    def test_save_ifta(self):
        """Test saving IFTA calculation"""
        data = {
            "mpg": 6.5,
            "total_fuel_purchased": 1000.0,
            "total_miles": 3000,
            "total_fuel_used": 461.5,
            "jurisdictions": [
                {
                    "state": "TX",
                    "miles": 1500,
                    "fuel_purchased": 200,
                    "tax_rate": 0.20,
                    "fuel_used": 230.8,
                    "net_taxable_fuel": 30.8,
                    "tax_due": 6.16
                },
                {
                    "state": "CA",
                    "miles": 1500,
                    "fuel_purchased": 300,
                    "tax_rate": 0.68,
                    "fuel_used": 230.8,
                    "net_taxable_fuel": -69.2,
                    "tax_due": -47.06
                }
            ],
            "total_tax_due": -40.90
        }
        success, response = self.run_test(
            "Save IFTA Calculation",
            "POST",
            "api/history/ifta",
            200,
            data=data
        )
        return success, response

    def test_save_bol(self):
        """Test saving BOL document"""
        data = {
            "bol_number": "BOL-2024-1234",
            "bol_date": "2024-01-15",
            "shipper_name": "Test Shipper Inc",
            "consignee_name": "Test Consignee LLC",
            "carrier_name": "Test Carrier Corp",
            "total_weight": "24,500",
            "freight_terms": "Prepaid"
        }
        success, response = self.run_test(
            "Save BOL Document",
            "POST",
            "api/history/bol",
            200,
            data=data
        )
        return success, response

    def test_get_history(self):
        """Test getting history"""
        success, response = self.run_test(
            "Get History",
            "GET",
            "api/history",
            200
        )
        return success, response

def main():
    print("🚀 Starting History API Tests")
    print("=" * 50)
    
    # Setup
    tester = HistoryAPITester()
    test_email = "testfleetowner@test.com"
    test_password = "qwerty123"

    # Login first
    if not tester.test_login(test_email, test_password):
        print("❌ Login failed, stopping tests")
        return 1

    # Test saving different types of history
    fuel_ok, fuel_response = tester.test_save_fuel_surcharge()
    ifta_ok, ifta_response = tester.test_save_ifta()
    bol_ok, bol_response = tester.test_save_bol()
    
    # Test getting history
    history_ok, history_response = tester.test_get_history()
    
    if history_ok:
        history_items = history_response.get('history', [])
        print(f"\n📋 Found {len(history_items)} history items")
        for i, item in enumerate(history_items[:3]):  # Show first 3
            print(f"   {i+1}. Type: {item.get('type')}, Date: {item.get('created_at')}")

    # Print summary
    print(f"\n📈 Overall: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All history API tests passed!")
        return 0
    else:
        print("⚠️  Some history API tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())