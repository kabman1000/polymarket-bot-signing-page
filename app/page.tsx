"use client";

import { useState, useEffect } from "react";
import { createAppKit } from '@reown/appkit/react'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { polygon } from '@reown/appkit/networks'
import { BrowserProvider } from "ethers";
import { useAppKit, useAppKitAccount, useAppKitProvider } from '@reown/appkit/react'

// 1. Get projectId from https://cloud.reown.com
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID_HERE";

// 2. Set up the Ethers Adapter
const ethersAdapter = new EthersAdapter()

// 3. Create the modal
const metadata = {
  name: "Polymarket Bot",
  description: "Sign your Polymarket bets",
  url: "https://polymarket-bot.com",
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

createAppKit({
  adapters: [ethersAdapter],
  networks: [polygon],
  metadata,
  projectId,
  features: {
    analytics: true,
  },
});

export default function Home() {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider('eip155');

  const [txData, setTxData] = useState<any>(null);
  const [status, setStatus] = useState("idle");
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const swapTo = params.get("swap_to");
    const swapData = params.get("swap_data");
    const approveTo = params.get("approve_to");
    const approveData = params.get("approve_data");

    if (swapTo && swapData) {
      setTxData({
        swap: { to: swapTo, data: swapData },
        approve: approveTo ? { to: approveTo, data: approveData } : null,
      });
    }
  }, []);

  const addLog = (msg: string) => setLogs((prev) => [...prev, msg]);

  const handleSign = async () => {
    if (!isConnected || !walletProvider) {
      addLog("Please connect wallet first");
      return;
    }

    setStatus("signing");
    try {
      const provider = new BrowserProvider(walletProvider);
      const signer = await provider.getSigner();

      addLog("Signer ready: " + address);

      if (txData.swap) {
        addLog("Sending Swap TX...");
        const tx1 = await signer.sendTransaction({
          to: txData.swap.to,
          data: txData.swap.data,
        });
        addLog("Swap TX sent: " + tx1.hash);
        await tx1.wait();
        addLog("Swap Confirmed!");
      }

      if (txData.approve) {
        addLog("Sending Approve TX...");
        const tx2 = await signer.sendTransaction({
          to: txData.approve.to,
          data: txData.approve.data,
        });
        addLog("Approve TX sent: " + tx2.hash);
        await tx2.wait();
        addLog("Approve Confirmed!");
      }

      addLog("✅ All transactions complete!");
      setStatus("success");
    } catch (e: any) {
      console.error(e);
      addLog("Error: " + e.message);
      setStatus("error");
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-900 text-white">
      <h1 className="text-4xl font-bold mb-8">Polymarket Bot Signer</h1>

      <div className="w-full max-w-md p-6 bg-gray-800 rounded-lg shadow-xl">
        {!isConnected ? (
          <button
            onClick={() => open()}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold"
          >
            Connect Wallet
          </button>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-gray-700 rounded">
              <p className="text-sm text-gray-400">Connected:</p>
              <p className="font-mono">{address?.slice(0, 6)}...{address?.slice(-4)}</p>
            </div>

            {txData ? (
              <div className="space-y-4">
                <div className="p-4 bg-gray-700 rounded">
                  <h3 className="font-bold mb-2">Transaction Details</h3>
                  <p className="text-sm">Swap: {txData.swap.to.slice(0, 10)}...</p>
                  {txData.approve && <p className="text-sm">Approve: {txData.approve.to.slice(0, 10)}...</p>}
                </div>

                <button
                  onClick={handleSign}
                  disabled={status === "signing" || status === "success"}
                  className={`w-full py-3 rounded-lg font-bold ${status === "success" ? "bg-green-600" :
                      status === "signing" ? "bg-yellow-600" : "bg-blue-600 hover:bg-blue-700"
                    }`}
                >
                  {status === "signing" ? "Signing..." :
                    status === "success" ? "Success!" : "Sign & Send"}
                </button>
              </div>
            ) : (
              <p className="text-yellow-400">No transaction data found in URL</p>
            )}

            <div className="mt-4 p-2 bg-black rounded text-xs font-mono h-32 overflow-y-auto">
              {logs.map((log, i) => (
                <div key={i}>{log}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
