import Web3Modal from "web3modal";
import Web3 from "web3";
import WalletConnectProvider from "@walletconnect/web3-provider";
import Fortmatic from "fortmatic";
import Torus from "@toruslabs/torus-embed";
import Portis from "@portis/web3";
import Squarelink from "squarelink";
import WalletLink from "walletlink";
import Authereum from "authereum";

import { coinbase } from "./logos";

/**
 * @typedef Keys
 * @type {object}
 * @property {string} fortmaticKey
 * @property {string} infuraId
 * @property {string} portisId
 * @property {string} squarelinkId
 *
 * @typedef {"metaMask" | "walletLink" | "walletConnet" | "portis" | "torus" | "fortmatic" | "squarelink" | "authereum"} ProviderName
 *
 * @typedef ConnectResponse
 * @type {object}
 * @property {string} account
 * @property {Web3} web3
 * @property {string} provider
 */

/**
 * Local Storage key
 */
export const LCwalletConnecorProvider = "wallet-connector-provider";
/**
 * Local Storage key
 */
export const LCwalletConnecorAccount = "wallet-connector-account";

export default class WalletConnector {
    /**
     * Creates WalletConnector instance and web3Modal instance with options
     * @constructor
     * @param {Keys} keys - api keys and project ids
     */
    constructor(keys, theme = "light") {
        /**
         * @private
         * @type {ConnectResponse & { response: any } | undefined}
         */
        this._currentConnection = undefined;
        /**
         * This function will be called after clear method
         * @private
         * @type {(() => {})[]}
         */
        this._HANDLEclearConnection = [];
        /**
         * This function will be called after connect method
         * @private
         * @type {((connectResponse: ConnectResponse) => {})[]}
         */
        this._HANDLEconnect = [];
        /**
         * This function will be called after save method
         * @private
         * @type {((connectResponse: ConnectResponse) => {})[]}
         */
        this._HANDLEsave = [];

        this.keys = keys;

        const providerOptions = {
            walletconnect: {
                package: WalletConnectProvider,
                options: {
                    infuraId: keys.infuraId,
                },
            },
            fortmatic: {
                package: Fortmatic,
                options: {
                    key: keys.fortmaticKey,
                },
            },
            torus: {
                package: Torus,
                options: {},
            },
            portis: {
                package: Portis,
                options: {
                    id: keys.portisId,
                },
            },
            squarelink: {
                package: Squarelink,
                options: {
                    id: keys.squarelinkId,
                },
            },
            authereum: {
                package: Authereum,
            },
            "custom-walletlink": {
                display: {
                    logo: coinbase,
                    name: "WalletLink",
                    description: "Scan with WalletLink",
                },
                package: WalletLink,
                options: {},
                connector: async (givenWalletLink) => {
                    const walletLink = new givenWalletLink({
                        appName: "My Awesome App",
                        appLogoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/863px-Apple_logo_black.svg.png",
                        darkMode: false,
                    });
                    const ethereum = walletLink.makeWeb3Provider(`https://mainnet.infura.io/v3/${keys.infuraId}`, 1);
                    const web3 = new Web3(ethereum);
                    const getAccounts = async () => ethereum.send("eth_requestAccounts");
                    await ethereum.enable();
                    return { isWalletLink: true, web3, getAccounts };
                },
            },
        };

        this.web3Modal = new Web3Modal({
            network: "mainnet",
            providerOptions,
            theme,
        });
    }
    /**
     * Creates WalletConnector instance
     * @private
     * @param {object} response - variable that you get from connect() method
     * @returns {Promise<ConnectResponse>}
     */
    async _analyzeConnectResponse(response) {
        if (response.bridge === "https://bridge.walletconnect.org") {
            const web3 = new Web3(response.rpcUrl);
            const [account] = response.accounts;
            return { web3, account, provider: "walletConnet" };
        } else if (response.isPortis) {
            const portis = new Portis(this.keys.portisId, "mainnet");
            const web3 = new Web3(portis.provider);
            const [account] = await web3.eth.getAccounts();
            return {
                account,
                web3,
                provider: "portis",
            };
        } else if (response.isTorus) {
            const res = await response.enable();
            const [account] = res;
            const torus = new Torus({});
            await torus.init({});
            await torus.login({});
            const web3 = new Web3(torus.provider);
            return {
                web3,
                account,
                provider: "torus",
            };
        } else if (response.isFortmatic) {
            const fm = new Fortmatic(this.keys.fortmaticKey);
            const web3 = new Web3(fm.getProvider());
            const [account] = await web3.eth.getAccounts();
            return {
                web3,
                account,
                provider: "fortmatic",
            };
        } else if (response.isSquarelink) {
            const sqlk = new Squarelink(this.keys.squarelinkId, "mainnet");
            const web3 = new Web3(await sqlk.getProvider());
            const [account] = response.sqlk.accounts;
            return {
                web3,
                account,
                provider: "squarelink",
            };
        } else if (response.isMetaMask) {
            const web3 = new Web3(window.ethereum);
            const account = response.selectedAddress;
            return {
                web3,
                account,
                provider: "metaMask",
            };
        } else if (response.isWalletLink) {
            const web3 = response.web3;
            const [account] = await response.getAccounts();
            return {
                web3,
                account,
                provider: "walletLink",
            };
        } else if (response.authereum) {
            const authereum = new Authereum("mainnet");
            const provider = authereum.getProvider();
            const web3 = new Web3(provider);
            const [account] = await web3.eth.getAccounts();
            return {
                web3,
                account,
                provider: "authereum",
            };
        } else {
            throw new Error("Unknown provider in WalletConnector in conncet()");
        }
    }
    /** Local Storage clear
     * @private
     */
    _clearLocalStorage() {
        window.localStorage.removeItem(LCwalletConnecorProvider);
        window.localStorage.removeItem(LCwalletConnecorAccount);
        // wallet connect
        window.localStorage.removeItem("loglevel:torus-embed");
        window.localStorage.removeItem("-walletlink:https://www.walletlink.org:session:linked");
        window.localStorage.removeItem("walletconnect");
        window.localStorage.removeItem("-walletlink:https://www.walletlink.org:session:id");
        window.localStorage.removeItem("-walletlink:https://www.walletlink.org:session:secret");

        // torus
        window.localStorage.removeItem("loglevel:torus-embed");
        window.localStorage.removeItem("loglevel:torus.js");

        // wallet link
        window.localStorage.removeItem("-walletlink:https://www.walletlink.org:Addresses");
        window.localStorage.removeItem("-walletlink:https://www.walletlink.org:session:linked");
        window.localStorage.removeItem("-walletlink:https://www.walletlink.org:session:id");
        window.localStorage.removeItem("-walletlink:https://www.walletlink.org:session:secret");
    }
    /**
     * Writes to local storage provider and account address
     */
    saveConnection() {
        if (!this._currentConnection) {
            console.warn("Nothing to save in WalletConnector");
            return;
        }
        window.localStorage.setItem(LCwalletConnecorProvider, this._currentConnection.provider);
        window.localStorage.setItem(LCwalletConnecorAccount, this._currentConnection.account);
        this._HANDLEsave.map((f) => f(this._currentConnection));
    }
    clearConnection() {
        this._clearLocalStorage();
        this._currentConnection = null;
        this._HANDLEclearConnection.map((f) => f());
    }
    /**
     * Use web3model connect method and returns { web3, account, provider } if success and throws Error if not
     * @returns {Promise<ConnectResponse>}
     */
    async connect() {
        this._clearLocalStorage();
        const response = await this.web3Modal.connect();
        if (response.on) {
            response.on("accountsChanged", (accounts) => {
                this._currentConnection = this._currentConnection || {};
                this._currentConnection.account = accounts[0];
            });
            response.on("disconnect", (e) => console.log("disconnect", e));
        }
        const connectResponse = await this._analyzeConnectResponse(response);
        this._currentConnection = { ...connectResponse, response };
        this._HANDLEconnect.map((f) => f(this._currentConnection));
        return connectResponse;
    }
    /**
     * @returns {Promise<ConnectResponse>}
     */
    async connectAndSave() {
        const res = await this.connect();
        this.saveConnection();
        return res;
    }
    /**
     * @returns {Promise<ConnectResponse | undefined>}
     */
    async tryGetSavedConnection() {
        const account = window.localStorage.getItem(LCwalletConnecorAccount);
        const provider = window.localStorage.getItem(LCwalletConnecorProvider);
        if (!(account && provider)) return undefined;
        return {
            account,
            provider,
            web3: this.getWeb3(),
        };
    }
    /**
     * @param {ProviderName} provider
     * @returns {Web3}
     */
    getWeb3() {
        return new Web3(`https://mainnet.infura.io/v3/${this.keys.infuraId}`);
    }
    /**
     * @private
     * @param {string} event
     */
    _validateEventName(event) {
        const events = ["clearConnection", "connect", "save", "accountsChanged"];
        return events.includes(event);
    }
    /**
     * @param {"clearConnection" | "connect" | "save"} eventName
     * @param {() => {}} func
     */
    on(eventName, func) {
        const isValidEventName = this._validateEventName(eventName);
        if (isValidEventName) {
            this[`_HANDLE${eventName}`].push(func);
        }
    }
}
