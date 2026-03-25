import requests
import sys
from datetime import datetime

class BackendAPITester:
    def __init__(self, base_url="https://981d5552-e907-49f6-a000-953b349b48f4.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {response_data}")
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

    def test_health_check(self):
        """Test health endpoint"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "api/health",
            200
        )
        return success

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
            print(f"   Token obtained: {self.token[:20]}...")
            return True, response
        return False, {}

    def test_get_user(self):
        """Get authenticated user info"""
        success, response = self.run_test(
            "Get User Info",
            "GET",
            "api/auth/user",
            200
        )
        return success, response

    def test_signup(self, email, password, name="Test User"):
        """Test user signup"""
        success, response = self.run_test(
            "User Signup",
            "POST",
            "api/auth/signup",
            200,
            data={"email": email, "password": password, "name": name}
        )
        return success, response

    def test_invalid_login(self):
        """Test login with invalid credentials"""
        success, response = self.run_test(
            "Invalid Login",
            "POST",
            "api/auth/login",
            401,
            data={"email": "invalid@test.com", "password": "wrongpass"}
        )
        return success

    def test_protected_route_without_token(self):
        """Test protected route without authentication"""
        # Temporarily remove token
        temp_token = self.token
        self.token = None
        
        success, response = self.run_test(
            "Protected Route Without Token",
            "GET",
            "api/auth/user",
            401
        )
        
        # Restore token
        self.token = temp_token
        return success

def main():
    print("🚀 Starting Backend API Tests")
    print("=" * 50)
    
    # Setup
    tester = BackendAPITester()
    test_email = "testfleetowner@test.com"
    test_password = "qwerty123"

    # Test sequence
    tests_results = []
    
    # 1. Health check
    print("\n📋 Testing Basic Connectivity")
    health_ok = tester.test_health_check()
    tests_results.append(("Health Check", health_ok))
    
    if not health_ok:
        print("❌ Health check failed, stopping tests")
        return 1

    # 2. Test invalid login first
    print("\n🔒 Testing Authentication")
    invalid_login_ok = tester.test_invalid_login()
    tests_results.append(("Invalid Login Rejection", invalid_login_ok))

    # 3. Test valid login
    login_ok, login_response = tester.test_login(test_email, test_password)
    tests_results.append(("Valid Login", login_ok))
    
    if not login_ok:
        print("❌ Login failed, stopping tests")
        return 1

    # 4. Test protected route without token
    protected_without_token_ok = tester.test_protected_route_without_token()
    tests_results.append(("Protected Route Security", protected_without_token_ok))

    # 5. Test getting user info with token
    user_info_ok, user_response = tester.test_get_user()
    tests_results.append(("Get User Info", user_info_ok))

    # 6. Test signup with new user (optional - might fail if user exists)
    print("\n👤 Testing User Registration")
    new_email = f"test_{int(datetime.now().timestamp())}@test.com"
    signup_ok, signup_response = tester.test_signup(new_email, "testpass123", "New Test User")
    tests_results.append(("User Signup", signup_ok))

    # Print summary
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    
    for test_name, result in tests_results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print(f"\n📈 Overall: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())