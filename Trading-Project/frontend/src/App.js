import React from 'react';
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import MarketOverview from './components/MarketOverview';
import Footer from './components/Footer';
import ChartPage from './components/chart/ChartPage';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-[#131722]">
      <Navbar />
      <div className="pt-[52px]">
        <Hero />
        <MarketOverview />
        <Footer />
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/chart" element={<ChartPage />} />
          <Route path="/chart/:symbol" element={<ChartPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
