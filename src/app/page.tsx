import { api, HydrateClient } from "~/trpc/server";
import SetMenusPage from "./_components/set-menus";

export default async function Home() {
  void api.setMenu.getMenus.prefetch({});

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center">
        <SetMenusPage />
      </main>
    </HydrateClient>
  );
}
