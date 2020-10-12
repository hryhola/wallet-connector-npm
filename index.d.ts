import Web3 from "web3";
import Web3Modal from "web3modal";
declare module "wallet-connector" {
    export interface Keys {
        fortmaticKey: string;
        infuraId: string;
        portisId: string;
        squarelinkId: string;
    }

    export type ProviderName = "metaMask" | "walletLink" | "walletConnet" | "portis" | "torus" | "fortmatic" | "squarelink" | "authereum";

    export interface ConnectResponse {
        account: string;
        web3: Web3;
        provider: ProviderName;
    }

    export const LCwalletConnecorProvider: string;
    export const LCwalletConnecorAccount: string;

    export default class WalletConnector {
        constructor(keys: Keys, theme: "light" | "dark");
        private _analyzeConnectResponse(response: object): Promise<ConnectResponse>;
        private _currentConnection: (ConnectResponse & { response: any }) | undefined;
        private _HANDLEclearConnection: (() => {})[];
        private _HANDLEconnect: ((connectResponse: ConnectResponse) => {})[];
        private _HANDLEsave: ((connectResponse: ConnectResponse) => {})[];
        private _clearLocalStorage(): void;
        private _validateEventName(name: string): boolean;
        public saveConnection(): void;
        public clearConnection(): void;
        public connect(): Promise<ConnectResponse>;
        public connectAndSave(): Promise<ConnectResponse>;
        public tryGetSavedConnection(): Promise<ConnectResponse | undefined>;
        public getWeb3(): Web3;
        public on(eventName: "clearConnection" | "connect" | "save", func: (args:any) => void): void;
        readonly keys: Keys;
        readonly web3Modal: Web3Modal;
    }
}
