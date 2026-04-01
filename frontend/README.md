# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

---

### Blockchain setup ⚙️

This front‑end interacts with a locally deployed Hardhat contract. Follow these steps to avoid MetaMask RPC errors:

1. **Start a Hardhat node** in the `blockchain/` folder:
   ```bash
   cd blockchain
   npx hardhat node
   ```
   Leave the node running while you work.

2. **Deploy the contract** (in another terminal) and copy the address:
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```
   Update `src/config/contract.js` if it differs from the printed address.

3. **Configure MetaMask** with the local network:
   - Network name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:7545`
   - Chain ID: `31337`
   - Currency: `ETH`
   Switch to this network before connecting the wallet.

4. The dApp will now be able to call `createFarmerBatch` and other methods without the
   `Failed to fetch` RPC error.

> If you still see the error, make sure the node is running and that MetaMask's
> selected network matches the contract address chain ID.
