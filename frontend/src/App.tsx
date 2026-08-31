import './App.css'
import './index.css';
import { timeLeftYear } from './utils/timeLeftYear';



function App() {

  const newYear = timeLeftYear();

  return (
    <>
      <div
        style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}
      >
        <div
          style={{ textAlign: "center" }}
        >
          Happy New Year in: {newYear} days.
        </div>
      </div>
    </>
  )
}

export default App
