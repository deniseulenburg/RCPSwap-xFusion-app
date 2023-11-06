/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  MulticallRouter,
  MulticallRouterInterface,
} from "../MulticallRouter";

const _abi = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_amountIn",
        type: "uint256",
      },
      {
        internalType: "bytes[]",
        name: "_calldata",
        type: "bytes[]",
      },
      {
        internalType: "address[]",
        name: "_receiveSides",
        type: "address[]",
      },
      {
        internalType: "address[]",
        name: "_path",
        type: "address[]",
      },
      {
        internalType: "uint256[]",
        name: "_offset",
        type: "uint256[]",
      },
      {
        internalType: "address",
        name: "_to",
        type: "address",
      },
    ],
    name: "multicall",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b50610de6806100206000396000f3fe608060405234801561001057600080fd5b506004361061002b5760003560e01c80631e859a0514610030575b600080fd5b61004361003e366004610b54565b610045565b005b6100718360008151811061005b5761005b610c1a565b602002602001015161006a3390565b30896103af565b60005b85518110156102b157600084828151811061009157610091610c1a565b60209081029190910101516040517f70a0823100000000000000000000000000000000000000000000000000000000815230600482015273ffffffffffffffffffffffffffffffffffffffff909116906370a0823190602401602060405180830381865afa158015610107573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061012b9190610c30565b9050600087838151811061014157610141610c1a565b60200260200101519050600085848151811061015f5761015f610c1a565b6020026020010151905082818301526101ab87858151811061018357610183610c1a565b602002602001015189868151811061019d5761019d610c1a565b602002602001015185610534565b6000808986815181106101c0576101c0610c1a565b602002602001015173ffffffffffffffffffffffffffffffffffffffff16846040516101ec9190610c79565b6000604051808303816000865af19150503d8060008114610229576040519150601f19603f3d011682016040523d82523d6000602084013e61022e565b606091505b50915091508161029957610277816040518060400160405280601c81526020017f4d756c746963616c6c526f757465723a2063616c6c206661696c6564000000008152506105e5565b60405162461bcd60e51b81526004016102909190610c95565b60405180910390fd5b505050505080806102a990610cde565b915050610074565b50600083600185516102c39190610cf9565b815181106102d3576102d3610c1a565b60209081029190910101516040517f70a0823100000000000000000000000000000000000000000000000000000000815230600482015273ffffffffffffffffffffffffffffffffffffffff909116906370a0823190602401602060405180830381865afa158015610349573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061036d9190610c30565b905080156103a6576103a684600186516103879190610cf9565b8151811061039757610397610c1a565b6020026020010151838361061b565b50505050505050565b6040805173ffffffffffffffffffffffffffffffffffffffff85811660248301528481166044830152606480830185905283518084039091018152608490920183526020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff167f23b872dd00000000000000000000000000000000000000000000000000000000179052915160009283929088169161044e9190610c79565b6000604051808303816000865af19150503d806000811461048b576040519150601f19603f3d011682016040523d82523d6000602084013e610490565b606091505b50915091508180156104ba5750805115806104ba5750808060200190518101906104ba9190610d10565b61052c5760405162461bcd60e51b815260206004820152603160248201527f5472616e7366657248656c7065723a3a7472616e7366657246726f6d3a20747260448201527f616e7366657246726f6d206661696c65640000000000000000000000000000006064820152608401610290565b505050505050565b6040517fdd62ed3e00000000000000000000000000000000000000000000000000000000815230600482015273ffffffffffffffffffffffffffffffffffffffff838116602483015282919085169063dd62ed3e90604401602060405180830381865afa1580156105a9573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906105cd9190610c30565b10156105e0576105e08383600019610797565b505050565b60606044835110156105f8575080610615565b600483019250828060200190518101906106129190610d39565b90505b92915050565b6040805173ffffffffffffffffffffffffffffffffffffffff8481166024830152604480830185905283518084039091018152606490920183526020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff167fa9059cbb0000000000000000000000000000000000000000000000000000000017905291516000928392908716916106b29190610c79565b6000604051808303816000865af19150503d80600081146106ef576040519150601f19603f3d011682016040523d82523d6000602084013e6106f4565b606091505b509150915081801561071e57508051158061071e57508080602001905181019061071e9190610d10565b6107905760405162461bcd60e51b815260206004820152602d60248201527f5472616e7366657248656c7065723a3a736166655472616e736665723a20747260448201527f616e73666572206661696c6564000000000000000000000000000000000000006064820152608401610290565b5050505050565b6040805173ffffffffffffffffffffffffffffffffffffffff8481166024830152604480830185905283518084039091018152606490920183526020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff167f095ea7b300000000000000000000000000000000000000000000000000000000179052915160009283929087169161082e9190610c79565b6000604051808303816000865af19150503d806000811461086b576040519150601f19603f3d011682016040523d82523d6000602084013e610870565b606091505b509150915081801561089a57508051158061089a57508080602001905181019061089a9190610d10565b6107905760405162461bcd60e51b815260206004820152602b60248201527f5472616e7366657248656c7065723a3a73616665417070726f76653a2061707060448201527f726f7665206661696c65640000000000000000000000000000000000000000006064820152608401610290565b634e487b7160e01b600052604160045260246000fd5b604051601f8201601f1916810167ffffffffffffffff8111828210171561094b5761094b61090c565b604052919050565b600067ffffffffffffffff82111561096d5761096d61090c565b5060051b60200190565b600067ffffffffffffffff8211156109915761099161090c565b50601f01601f191660200190565b600082601f8301126109b057600080fd5b813560206109c56109c083610953565b610922565b82815260059290921b840181019181810190868411156109e457600080fd5b8286015b84811015610a6357803567ffffffffffffffff811115610a085760008081fd5b8701603f81018913610a1a5760008081fd5b848101356040610a2c6109c083610977565b8281528b82848601011115610a415760008081fd5b82828501898301376000928101880192909252508452509183019183016109e8565b509695505050505050565b803573ffffffffffffffffffffffffffffffffffffffff81168114610a9257600080fd5b919050565b600082601f830112610aa857600080fd5b81356020610ab86109c083610953565b82815260059290921b84018101918181019086841115610ad757600080fd5b8286015b84811015610a6357610aec81610a6e565b8352918301918301610adb565b600082601f830112610b0a57600080fd5b81356020610b1a6109c083610953565b82815260059290921b84018101918181019086841115610b3957600080fd5b8286015b84811015610a635780358352918301918301610b3d565b60008060008060008060c08789031215610b6d57600080fd5b86359550602087013567ffffffffffffffff80821115610b8c57600080fd5b610b988a838b0161099f565b96506040890135915080821115610bae57600080fd5b610bba8a838b01610a97565b95506060890135915080821115610bd057600080fd5b610bdc8a838b01610a97565b94506080890135915080821115610bf257600080fd5b50610bff89828a01610af9565b925050610c0e60a08801610a6e565b90509295509295509295565b634e487b7160e01b600052603260045260246000fd5b600060208284031215610c4257600080fd5b5051919050565b60005b83811015610c64578181015183820152602001610c4c565b83811115610c73576000848401525b50505050565b60008251610c8b818460208701610c49565b9190910192915050565b6020815260008251806020840152610cb4816040850160208701610c49565b601f01601f19169190910160400192915050565b634e487b7160e01b600052601160045260246000fd5b6000600019821415610cf257610cf2610cc8565b5060010190565b600082821015610d0b57610d0b610cc8565b500390565b600060208284031215610d2257600080fd5b81518015158114610d3257600080fd5b9392505050565b600060208284031215610d4b57600080fd5b815167ffffffffffffffff811115610d6257600080fd5b8201601f81018413610d7357600080fd5b8051610d816109c082610977565b818152856020838501011115610d9657600080fd5b610da7826020830160208601610c49565b9594505050505056fea264697066735822122093d426beff7768b31552a91402fe54dbd5fff518998f3cc478bad3a1a60f5f8e64736f6c634300080b0033";

type MulticallRouterConstructorParams = any

const isSuperArgs = (
  xs: MulticallRouterConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class MulticallRouter__factory extends ContractFactory {
  constructor(...args: MulticallRouterConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
    this.contractName = "MulticallRouter";
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<MulticallRouter> {
    return super.deploy(overrides || {}) as Promise<MulticallRouter>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): MulticallRouter {
    return super.attach(address) as MulticallRouter;
  }
  connect(signer: Signer): MulticallRouter__factory {
    return super.connect(signer) as MulticallRouter__factory;
  }
  static readonly contractName: "MulticallRouter";
  public readonly contractName: "MulticallRouter";
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): MulticallRouterInterface {
    return new utils.Interface(_abi) as MulticallRouterInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): MulticallRouter {
    return new Contract(address, _abi, signerOrProvider) as MulticallRouter;
  }
}
