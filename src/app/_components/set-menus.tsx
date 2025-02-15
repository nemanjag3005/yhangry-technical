/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client";
import { api } from "~/trpc/react";
import { useDispatch, useSelector } from "react-redux";
import {
  setSelectedGuests,
  setSelectedCuisine,
} from "~/redux/slices/menuSlice";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import Image from "next/image";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
import { type RootState } from "~/redux/store";

const SetMenusPage = () => {
  // State management
  const dispatch = useDispatch();
  const guests = useSelector((state: RootState) => state.menu.selectedGuests);
  const selectedCuisine = useSelector(
    (state: RootState) => state.menu.selectedCuisine,
  );

  const { data, isLoading, fetchNextPage, hasNextPage, refetch, isError } =
    api.setMenu.getMenus.useInfiniteQuery(
      {
        limit: 6,
        cuisineSlug: selectedCuisine || undefined,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        initialCursor: 1,

        retry: 3, // Retry failed requests 3 times
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      },
    );

  const calculateTotalPrice = (
    pricePerPerson: number,
    minimumSpend: number,
  ) => {
    const total = pricePerPerson * guests;
    return Math.max(total, minimumSpend);
  };

  const handleGuestChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value > 0) {
      dispatch(setSelectedGuests(value));
    }
  };

  const handleCuisineClick = (slug: string) => {
    dispatch(setSelectedCuisine(slug === selectedCuisine ? "" : slug));
  };

  // Error view
  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" className="mb-8">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Failed to load menus</AlertDescription>
        </Alert>
        <Button
          onClick={() => refetch()}
          variant="outline"
          className="w-full md:w-auto"
        >
          Try Again
        </Button>
      </div>
    );
  }

  // Loading view
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-zinc-900" />
      </div>
    );
  }

  const allMenus = data?.pages.flatMap((page) => page.data) ?? [];
  const cuisines = data?.pages[0]?.cuisines ?? [];

  // No data view
  if (allMenus.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <CardContent>
            <h2 className="mb-4 text-xl font-semibold">No Menus Found</h2>
            <p className="mb-4 text-gray-600">
              {selectedCuisine
                ? "No menus available for the selected cuisine."
                : "No menus are currently available."}
            </p>
            {selectedCuisine && (
              <Button
                onClick={() => dispatch(setSelectedCuisine(""))}
                variant="outline"
              >
                Clear Filter
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-10 text-3xl font-bold">Set Menus</h1>
        <div className="mb-10 flex w-full flex-col justify-between border-b pb-4 sm:flex-row">
          {/* Guest Input */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Number of Guests
              <Input
                type="number"
                min="1"
                value={guests}
                onChange={handleGuestChange}
                className="mt-2"
              />
            </label>
          </div>

          {/* Cuisine Filters */}
          <div>
            <h1 className="text-sm font-medium">Cuisines</h1>
            <div className="mt-2 flex flex-wrap gap-2">
              {cuisines.map((cuisine) => (
                <Button
                  key={cuisine.id}
                  variant={
                    selectedCuisine === cuisine.slug ? "default" : "outline"
                  }
                  onClick={() => handleCuisineClick(cuisine.slug as string)}
                  className="flex items-center space-x-2"
                >
                  <span>{cuisine.name}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-sm text-slate-700">
                    {cuisine.liveMenuCount}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-3 lg:gap-x-8">
          {allMenus.map((menu) => (
            <div
              key={menu.id}
              className="group relative flex flex-col overflow-hidden rounded-lg bg-white"
            >
              <div className="relative aspect-[3/4] h-56 w-full rounded-lg bg-zinc-200 object-cover group-hover:opacity-75 sm:aspect-auto sm:h-80">
                <Image
                  src={menu.thumbnail ?? ""}
                  alt={menu.name}
                  fill
                  className="w-full rounded-lg object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col space-y-2 px-1 py-4">
                <div className="mt-2 flex flex-wrap gap-2">
                  {menu.cuisines.map((cuisineItem) => (
                    <Badge key={cuisineItem.cuisine.id}>
                      {cuisineItem.cuisine.name}
                    </Badge>
                  ))}
                </div>
                <h3 className="text-lg font-medium text-zinc-900">
                  <span aria-hidden="true" className="absolute inset-0" />
                  {menu.name}
                </h3>
                <p className="mb-4 text-sm text-zinc-500">{menu.description}</p>
                <div className="flex flex-wrap gap-2">
                  {menu.isVegan && (
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">
                      Vegan
                    </span>
                  )}
                  {menu.isVegetarian && (
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">
                      Vegetarian
                    </span>
                  )}
                  {menu.isHalal && (
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
                      Halal
                    </span>
                  )}
                  {menu.isKosher && (
                    <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
                      Kosher
                    </span>
                  )}
                </div>
                <p className="text-base font-medium text-zinc-900">
                  £
                  {calculateTotalPrice(
                    menu.pricePerPerson as number,
                    menu.minSpend as number,
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>

        {hasNextPage && (
          <div className="mt-8 flex justify-center">
            <Button
              onClick={() => fetchNextPage()}
              variant="outline"
              size="lg"
              className="w-full md:w-auto"
            >
              Show More
            </Button>
          </div>
        )}
        <p className="mx-auto mt-6 text-center text-sm text-zinc-500">
          Showing {allMenus.length} out of{" "}
          {data?.pages[0]?.pagination.total ?? 0} menus
        </p>
      </div>
    </div>
  );
};

export default SetMenusPage;
