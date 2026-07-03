import Home from "./pages/Home";
import MobileCheckout from "./pages/MobileCheckout";

export default function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get("orderId");

  if (orderId) {
    return <MobileCheckout />;
  }

  return <Home />;
}
