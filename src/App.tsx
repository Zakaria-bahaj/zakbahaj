import { useEffect, useState } from "react";
import Site from "./Site";
import Admin from "./Admin";
const parse = () => location.hash.replace(/^#/, "") || "/";
export default function App() {
  const [path, setPath] = useState(parse());
  useEffect(() => {
    const f = () => setPath(parse());
    addEventListener("hashchange", f);
    return () => removeEventListener("hashchange", f);
  }, []);
  return path.startsWith("/admin") ? <Admin /> : <Site path={path} />;
}
