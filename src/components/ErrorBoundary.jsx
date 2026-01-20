import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 bg-rose-50 min-h-screen font-sans text-rose-900">
                    <h1 className="text-3xl font-bold mb-4">Something went wrong.</h1>
                    <p className="mb-4">The application crashed. Here is the error:</p>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-rose-200 font-mono text-sm overflow-auto">
                        <p className="font-bold text-rose-600 mb-2">{this.state.error && this.state.error.toString()}</p>
                        <pre className="text-slate-500 whitespace-pre-wrap">
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </pre>
                    </div>

                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
                    >
                        Reload Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
