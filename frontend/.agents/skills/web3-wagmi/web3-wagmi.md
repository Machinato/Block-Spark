# Web3 & Wagmi v2 Development Guidelines

You are a Senior Web3 Frontend Engineer. When interacting with smart contracts in this Next.js App Router project, you MUST strictly follow these Wagmi v2 and Viem patterns. 

## 1. Core Stack & Restrictions
- **ALWAYS** use `wagmi` (v2.x) and `viem` for blockchain interactions.
- **NEVER** use `ethers.js` or `@ethersproject` directly in Next.js UI components.
- **NEVER** use deprecated Wagmi v1 hooks (e.g., `useContractRead`, `useContractWrite`, `usePrepareContractWrite`).

## 2. ABI Handling
- **ALWAYS** assert imported ABIs `as const` so TypeScript can infer the exact contract methods and arguments.
- Example: `export const campaignAbi = [...] as const;`

## 3. Reading Data (useReadContract)
- Use `useReadContract` to fetch data from the blockchain.
- Always destructure and handle `data`, `isLoading` (or `isPending`), and `isError` to provide proper UI feedback.
- Example:
  ```typescript
  import { useReadContract } from 'wagmi';
  
  const { data: targetAmount, isLoading } = useReadContract({
    address: campaignAddress,
    abi: campaignAbi,
    functionName: 'targetAmount',
  });
4. Writing Data & Transaction UX (CRITICAL)
NEVER execute a transaction without tracking its on-chain confirmation.

You MUST use a two-step pattern: useWriteContract (to sign/send) + useWaitForTransactionReceipt (to wait for block inclusion).

The UI button MUST be disabled/loading if isPending (awaiting wallet signature) OR isConfirming (awaiting block mining).

Example:

TypeScript
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';

const { data: hash, isPending: isSignPending, writeContract } = useWriteContract();

const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
  hash,
});

const handleInvest = () => {
  writeContract({
    address: campaignAddress,
    abi: campaignAbi,
    functionName: 'invest',
    value: parseEther('0.1'),
  });
};
// Button disabled state: disabled={isSignPending || isConfirming}
5. BigInt & Ether Conversion
Smart contract values (Wei) are bigint. NEVER convert them to native JS Number to avoid precision loss.

ALWAYS use viem utility functions for conversions:

formatEther(value): to display Wei as ETH string in the UI.

parseEther(value): to convert user string input (ETH) to Wei bigint before sending to the contract.

TypeScript
import { formatEther, parseEther } from 'viem';

const displayValue = targetAmount ? formatEther(targetAmount) : '0';

***

### Чому цей скіл спрацює ідеально для Antigravity? 🧠

1. **Тригерні слова (ALWAYS / NEVER / CRITICAL):** Агенти дуже добре реагують на такі маркери. Це змушує їх підвищувати пріоритет цих інструкцій над їхніми базовими знаннями з інтернету.
2. **Короткі приклади коду:** ШІ вчиться на прикладах. Ми не просто сказали "роби так", ми написали 4 рядки коду, які він може використовувати як шаблон. 
3. **Блок №4 (CRITICAL):** Це вирішує ту саму проблему UX. Агент тепер буде сам створювати красиві кнопки, які крутяться і чекають, поки транзакція не підтвердиться в мережі Sepolia.
4. **Блок №5:** Вирішує біль із `bigint` та змушує агента завжди тягнути `formatEther` із `viem`, а не винаходити свої конвертери.

Коли будеш рефакторити компоненти і просити додати Web3-логіку, просто пиши агенту: *"Integrate sma