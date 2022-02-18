import WalletConnect from "@walletconnect/client";
import QRCodeModal from "@walletconnect/qrcode-modal";
import Land from './LAND.json';
import BTC from './BTC.json';
import LTC from './LTC.json';
import ETC from './ETC.json';

module.exports = {
	contracts: {
		Land,
		BTC,
		LTC,
		ETC
	},
	openConnector: ($scope) => {
		window.connector = new WalletConnect({
			bridge: 'https://bridge.walletconnect.org',
			qrcodeModal: QRCodeModal
		});

		// window.connector.killSession();

		if (!window.connector.connected || (window.connector.connected && window.connector.session.accounts.length < 1))
			window.connector.createSession({ chainId: 80001 });
		else
			$scope.handleAccountsChanged(window.connector.session.accounts, false);

		window.connector.on('connect', (err, payload) => {
			if (err) toast('Error connecting to WalletConnect', true);
			else {
				window.usingInjected = false;
				// console.log(`Connected ${window.usingInjected}`);

				const { accounts, chainId } = payload.params[0];
				$scope.handleAccountsChanged(accounts, true);
				$scope.verifyChain(chainId);
			}
		});

		window.connector.on('disconnect', (_err, _payload) => {
			// console.log(`Dis Connected`);
			$scope.handleAccountsChanged([], true);
		});
	}
};