import React from "react";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ minHeight: "100vh", background: "#10141a" }}>
    {children}
  </div>
);

export default Layout;
