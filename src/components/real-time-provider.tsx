"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { RealtimeChannel } from "@supabase/supabase-js";

type RealtimeContextType = {
  subscribeToTable: (
    table: string,
    callback: (payload: any) => void,
    filter?: string,
  ) => void;
  unsubscribeFromTable: (table: string) => void;
};

const RealtimeContext = createContext<RealtimeContextType | null>(null);

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error("useRealtime must be used within a RealtimeProvider");
  }
  return context;
}

type RealtimeProviderProps = {
  children: ReactNode;
};

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const [channels, setChannels] = useState<Record<string, RealtimeChannel>>({});
  const [supabase, setSupabase] = useState<any>(null);

  useEffect(() => {
    // Initialize Supabase client
    const client = createBrowserSupabaseClient();
    setSupabase(client);

    // Cleanup function
    return () => {
      // Unsubscribe from all channels when component unmounts
      Object.values(channels).forEach((channel) => {
        if (client && channel) {
          client.removeChannel(channel);
        }
      });
    };
  }, []);

  const subscribeToTable = (
    table: string,
    callback: (payload: any) => void,
    filter?: string,
  ) => {
    if (!supabase) return;

    // Create a unique channel name
    const channelName = `${table}_${filter || "all"}`;

    // Check if we already have a subscription for this table/filter
    if (channels[channelName]) {
      console.log(`Already subscribed to ${channelName}`);
      return;
    }

    // Create subscription
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          ...(filter ? { filter } : {}),
        },
        callback,
      )
      .subscribe((status: string) => {
        console.log(
          `Subscription to ${table} ${status === "SUBSCRIBED" ? "established" : status}`,
        );
      });

    // Store the channel
    setChannels((prev) => ({
      ...prev,
      [channelName]: channel,
    }));
  };

  const unsubscribeFromTable = (table: string) => {
    if (!supabase) return;

    // Find all channels for this table
    Object.entries(channels).forEach(([name, channel]) => {
      if (name.startsWith(`${table}_`)) {
        supabase.removeChannel(channel);
        setChannels((prev) => {
          const newChannels = { ...prev };
          delete newChannels[name];
          return newChannels;
        });
      }
    });
  };

  return (
    <RealtimeContext.Provider
      value={{ subscribeToTable, unsubscribeFromTable }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}
