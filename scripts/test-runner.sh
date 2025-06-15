#!/bin/bash

# StoryForge Test Runner Script
# This script provides easy commands to run different test suites

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}🔧 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Function to run tests with error handling
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    print_step "Running $test_name..."
    
    if eval "$test_command"; then
        print_success "$test_name passed!"
        return 0
    else
        print_error "$test_name failed!"
        return 1
    fi
}

# Function to display help
show_help() {
    echo "StoryForge Test Runner"
    echo "====================="
    echo ""
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  unit              Run unit tests only"
    echo "  integration       Run integration tests only"
    echo "  e2e               Run end-to-end tests only"
    echo "  all               Run all tests (default)"
    echo "  coverage          Run tests with coverage report"
    echo "  watch             Run tests in watch mode"
    echo "  docker            Run tests in Docker container"
    echo "  docker-build      Build Docker test image"
    echo "  docker-clean      Clean Docker test containers"
    echo "  help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 unit           # Run only unit tests"
    echo "  $0 docker         # Run all tests in Docker"
    echo "  $0 coverage       # Run tests with coverage"
}

# Function to check if Docker is available
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed or not in PATH"
        exit 1
    fi
}

# Function to check if npm dependencies are installed
check_dependencies() {
    if [ ! -d "node_modules" ]; then
        print_warning "Node modules not found. Installing dependencies..."
        npm install
    fi
}

# Main execution
case "${1:-all}" in
    "unit")
        check_dependencies
        run_test "Unit Tests" "npm run test:run -- src/test/unit"
        ;;
    
    "integration")
        check_dependencies
        run_test "Integration Tests" "npm run test:run -- src/test/integration"
        ;;
    
    "e2e")
        check_dependencies
        print_step "Installing E2E test dependencies..."
        npm run test:install
        
        print_step "Building application..."
        npm run build
        
        run_test "End-to-End Tests" "npm run test:e2e"
        ;;
    
    "all")
        check_dependencies
        
        # Track test results
        unit_result=0
        integration_result=0
        e2e_result=0
        
        # Run unit tests
        run_test "Unit Tests" "npm run test:run -- src/test/unit" || unit_result=1
        
        # Run integration tests
        run_test "Integration Tests" "npm run test:run -- src/test/integration" || integration_result=1
        
        # Run E2E tests
        print_step "Installing E2E test dependencies..."
        npm run test:install
        
        print_step "Building application..."
        npm run build
        
        run_test "End-to-End Tests" "npm run test:e2e" || e2e_result=1
        
        # Summary
        echo ""
        echo "Test Summary:"
        echo "============="
        
        if [ $unit_result -eq 0 ]; then
            print_success "Unit Tests: PASSED"
        else
            print_error "Unit Tests: FAILED"
        fi
        
        if [ $integration_result -eq 0 ]; then
            print_success "Integration Tests: PASSED"
        else
            print_error "Integration Tests: FAILED"
        fi
        
        if [ $e2e_result -eq 0 ]; then
            print_success "E2E Tests: PASSED"
        else
            print_error "E2E Tests: FAILED"
        fi
        
        total_result=$((unit_result + integration_result + e2e_result))
        
        if [ $total_result -eq 0 ]; then
            print_success "🎉 All tests passed!"
            exit 0
        else
            print_error "💥 Some tests failed!"
            exit 1
        fi
        ;;
    
    "coverage")
        check_dependencies
        run_test "Tests with Coverage" "npm run test:coverage"
        print_step "Coverage report generated in coverage/ directory"
        ;;
    
    "watch")
        check_dependencies
        print_step "Starting tests in watch mode..."
        npm run test
        ;;
    
    "docker")
        check_docker
        print_step "Running tests in Docker container..."
        docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit storyforge-test
        ;;
    
    "docker-build")
        check_docker
        print_step "Building Docker test image..."
        docker build -f Dockerfile.test -t storyforge-test .
        print_success "Docker test image built successfully!"
        ;;
    
    "docker-clean")
        check_docker
        print_step "Cleaning Docker test containers..."
        docker-compose -f docker-compose.test.yml down --remove-orphans
        docker image prune -f
        print_success "Docker test containers cleaned!"
        ;;
    
    "help")
        show_help
        ;;
    
    *)
        print_error "Unknown option: $1"
        echo ""
        show_help
        exit 1
        ;;
esac