#!/usr/bin/env python3
"""
Test script to verify the integration is properly configured
Run this before starting the servers
"""
import sys
from pathlib import Path

def check_dependencies():
    """Check if required Python packages are installed"""
    required = [
        'fastapi',
        'uvicorn',
        'jwt',
        'passlib',
        'pydantic',
        'leann',
        'memori'
    ]

    missing = []
    for package in required:
        try:
            __import__(package)
            print(f"✓ {package} is installed")
        except ImportError:
            print(f"✗ {package} is NOT installed")
            missing.append(package)

    return missing


def check_files():
    """Check if required files exist"""
    base = Path(__file__).parent
    required_files = [
        'server/main.py',
        'src/scripts/leann_chat_api.py',
        'web/src/services/api.ts',
        'web/src/services/chatApi.ts',
        '.env'
    ]

    missing = []
    for file in required_files:
        filepath = base / file
        if filepath.exists():
            print(f"✓ {file} exists")
        else:
            print(f"✗ {file} is MISSING")
            missing.append(file)

    return missing


def check_env():
    """Check if .env file has required variables"""
    from dotenv import load_dotenv
    import os

    base = Path(__file__).parent
    env_path = base / '.env'

    if not env_path.exists():
        print("✗ .env file not found")
        return False

    load_dotenv(env_path)

    required_vars = ['OPENAI_API_KEY']
    missing = []

    for var in required_vars:
        value = os.getenv(var)
        if value:
            print(f"✓ {var} is set")
        else:
            print(f"✗ {var} is NOT set")
            missing.append(var)

    return missing


def check_data_directory():
    """Check if data/index directory exists"""
    base = Path(__file__).parent
    index_path = base / 'data' / 'index'

    if index_path.exists():
        files = list(index_path.glob('*'))
        print(f"✓ data/index exists with {len(files)} files")
        return True
    else:
        print("✗ data/index directory not found")
        return False


def main():
    print("=" * 60)
    print("LEANN Integration Test")
    print("=" * 60)

    print("\n1. Checking Python dependencies...")
    print("-" * 60)
    missing_deps = check_dependencies()

    print("\n2. Checking required files...")
    print("-" * 60)
    missing_files = check_files()

    print("\n3. Checking environment variables...")
    print("-" * 60)
    missing_env = check_env()

    print("\n4. Checking data directory...")
    print("-" * 60)
    data_ok = check_data_directory()

    print("\n" + "=" * 60)
    print("Summary")
    print("=" * 60)

    all_ok = True

    if missing_deps:
        print(f"⚠ Missing dependencies: {', '.join(missing_deps)}")
        print(f"  Run: pip install -r requirements.txt")
        all_ok = False

    if missing_files:
        print(f"⚠ Missing files: {', '.join(missing_files)}")
        all_ok = False

    if missing_env:
        print(f"⚠ Missing environment variables: {', '.join(missing_env)}")
        print(f"  Add them to .env file")
        all_ok = False

    if not data_ok:
        print("⚠ Data directory is not set up")
        print("  Make sure you have indexed documents in data/index/")
        all_ok = False

    if all_ok:
        print("\n✓ All checks passed! You're ready to start the servers.")
        print("\nNext steps:")
        print("  Terminal 1: ./start_backend.sh")
        print("  Terminal 2: ./start_frontend.sh")
        print("  Browser: http://localhost:5173")
        return 0
    else:
        print("\n✗ Some checks failed. Fix the issues above before starting.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
