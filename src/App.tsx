import RequestForm from './components/RequestForm';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col lg:flex-row">
      {/* Sidebar / Form Section */}
      <div className="lg:w-1/3 p-8 lg:p-12 lg:sticky lg:top-0 lg:h-screen flex items-center justify-center bg-white lg:bg-transparent">
        <RequestForm />
      </div>

      {/* Main Dashboard Section */}
      <Dashboard />
    </div>
  );
}

export default App;
