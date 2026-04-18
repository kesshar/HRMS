import { ethers } from "ethers";

const contractAddress = "0x0a32F13c0b083f5b9ddCE6acD402Cc7Ff3a657c8";

const abi = [
  "function logTask(string memory _taskId) public",
];

export const getContract = async () => {
  if (!window.ethereum) {
    alert("Please install MetaMask");
    return;
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return new ethers.Contract(contractAddress, abi, signer);
};