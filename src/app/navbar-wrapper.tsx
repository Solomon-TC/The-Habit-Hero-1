import Navbar from "../components/navbar";
import { getServerUser } from "../components/navbar-server";

export default async function NavbarWrapper() {
  const { user } = await getServerUser();

  return <Navbar user={user} />;
}
