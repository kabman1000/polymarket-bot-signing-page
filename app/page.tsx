"use client";

import { useState, useEffect } from "react";
import { BrowserProvider } from "ethers";

declare global {
  interface Window {
    ethereum?: any;
  }
}

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

  const handleDemoSign = async () => {
    setStatus("signing");
    addLog("🔵 DEMO MODE: Simulating transactions...");

    await new Promise(r => setTimeout(r, 1000));
    addLog("📝 Signing Swap Transaction...");
    await new Promise(r => setTimeout(r, 1500));
    addLog("✅ Swap Transaction Confirmed! (Simulated)");

    if (txData.approve) {
      await new Promise(r => setTimeout(r, 1000));
      addLog("📝 Signing Approve Transaction...");
      await new Promise(r => setTimeout(r, 1500));
      addLog("✅ Approve Transaction Confirmed! (Simulated)");
    }

    await new Promise(r => setTimeout(r, 1000));
    addLog("🚀 Order Placed Successfully! (Simulated)");
    setStatus("success");
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
          value: txData.swap.value || "0"
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

  const handleTestnetSign = async () => {
    if (!address) {
      addLog("Please connect wallet first");
      return;
    }

    setStatus("signing");
    addLog("🔵 Switching to Amoy Testnet...");

    try {
      const provider = new BrowserProvider(window.ethereum);

      // Switch to Amoy (Chain ID 80002)
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x13882' }], // 80002 in hex
        });
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x13882',
              chainName: 'Polygon Amoy Testnet',
              nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
              rpcUrls: ['https://rpc-amoy.polygon.technology'],
              blockExplorerUrls: ['https://www.oklink.com/amoy'],
            }],
          });
        } else {
          throw switchError;
        }
      }

      const signer = await provider.getSigner();
      addLog("✅ Network Switched. Sending Dummy TX...");

      // Send 0 MATIC to self to simulate a tx
      const tx = await signer.sendTransaction({
        to: address,
        value: "0",
        data: "0x" // Empty data
      });

      addLog("📝 Transaction Sent! Hash: " + tx.hash.slice(0, 10) + "...");
      await tx.wait();
      addLog("✅ Transaction Confirmed on Testnet!");

      // Simulate second tx if needed
      if (txData.approve) {
        addLog("📝 Sending 2nd Transaction (Simulation)...");
        const tx2 = await signer.sendTransaction({
          to: address,
          value: "0"
        });
        await tx2.wait();
        addLog("✅ All Transactions Confirmed!");
      }

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
                    status === "success" ? "Success!" : "Sign & Send (Mainnet)"}
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={handleTestnetSign}
                    className="flex-1 py-2 text-sm bg-purple-600 hover:bg-purple-700 rounded text-white"
                  >
                    Testnet Mode (Real TX)
                  </button>

                  <button
                    onClick={handleDemoSign}
                    className="flex-1 py-2 text-sm bg-gray-600 hover:bg-gray-700 rounded text-white"
                  >
                    Demo Mode (Fake)
                  </button>
                </div>
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
