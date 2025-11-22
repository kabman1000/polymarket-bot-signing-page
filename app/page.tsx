"use client";

import { useState, useEffect } from "react";
import { BrowserProvider } from "ethers";

export default function Page() {
  const [mounted, setMounted] = useState(false);
  const [address, setAddress] = useState<string>("");
  const [txData, setTxData] = useState<any>(null);
  const [status, setStatus] = useState("idle");
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);

    // Parse URL params
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

  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      addLog("Please install MetaMask!");
      return;
    }

    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAddress(accounts[0]);
      addLog("Connected: " + accounts[0]);
    } catch (e: any) {
      addLog("Error: " + e.message);
    }
  };

  const handleSign = async () => {
    if (!address) {
      addLog("Please connect wallet first");
      return;
    }

    setStatus("signing");
    try {
      const provider = new BrowserProvider(window.ethereum);
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

  if (!mounted) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-900 text-white">
        <div className="text-xl">Loading...</div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-900 text-white">
      <h1 className="text-4xl font-bold mb-8">Polymarket Bot Signer</h1>

      <div className="w-full max-w-md p-6 bg-gray-800 rounded-lg shadow-xl">
        {!address ? (
          <button
            onClick={connectWallet}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold"
          >
            Connect MetaMask
          </button>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-gray-700 rounded">
              <p className="text-sm text-gray-400">Connected:</p>
              <p className="font-mono text-sm">{address.slice(0, 6)}...{address.slice(-4)}</p>
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
