import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home.js"
import "./global.css"

const App = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* Adicione outras rotas de páginas aqui */}
      </Routes>
    </HashRouter>
  )
}

const container = document.getElementById('root')
const root = createRoot(container!)
root.render(<App />)