import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-screen items-center justify-center bg-forest-900 p-8">
          <div className="max-w-xl text-left">
            <div className="text-coral-400 font-semibold mb-2">Render error</div>
            <pre className="text-seafoam-200 text-xs whitespace-pre-wrap bg-forest-800 rounded p-4 border border-forest-600">
              {this.state.error.toString()}
              {"\n\n"}
              {this.state.error.stack}
            </pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
