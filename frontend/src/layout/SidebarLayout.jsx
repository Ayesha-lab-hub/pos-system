import { Outlet, Link } from "react-router-dom";

const SidebarLayout = () => {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-800 text-white p-4">
        <h2 className="text-xl font-bold mb-4">POS Dashboard</h2>
        <nav className="flex flex-col gap-2">
          <Link to="/" className="hover:underline">Dashboard</Link>
          <Link to="/add-buyer" className="hover:underline">Add Buyer</Link>
          <Link to="/add-supplier" className="hover:underline">Add Supplier</Link>
        </nav>
      </aside>
      <main className="flex-1 p-6 bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
};

export default SidebarLayout;
