export interface BinanceSupportedNetworkResponse {
  code: string;
  data: {
    networks: string[];
    coinDetail: {
      coin: string;
      netWorkDetailList: {
        network: string;
        networkName: string;
        withdrawEnable: boolean;
        contractAddress: string;
      }[];
    }[];
  };
  success: boolean;
}

export interface BinanceQuoteResponse {
  code: string;
  data: {
    transactionId: string;
    universalLinkUrl: string;
  };
  success: boolean;
}

export interface BinanceTransactionStatusResponse {
  code: string;
  data: {
    withdrawalStatus: "INIT" | "PROCESSING" | "SUCCESS" | "FAIL";
  };
}
