export const FUSION_CONTRACT = {
  address: '0xeC651281a8dC2d7aD3F060C2eCF1E8860b4d89B2',
  abi: [
    {
      inputs: [
        { internalType: 'address', name: '_weth', type: 'address' },
        { internalType: 'address', name: '_feeAddress', type: 'address' },
        { internalType: 'uint256', name: '_fee', type: 'uint256' }
      ],
      stateMutability: 'nonpayable',
      type: 'constructor'
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: 'address', name: 'factory', type: 'address' },
        { indexed: true, internalType: 'address', name: 'router', type: 'address' }
      ],
      name: 'DexAdded',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: 'address', name: 'factory', type: 'address' },
        { indexed: true, internalType: 'address', name: 'router', type: 'address' }
      ],
      name: 'DexRemoved',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: 'address', name: 'previousOwner', type: 'address' },
        { indexed: true, internalType: 'address', name: 'newOwner', type: 'address' }
      ],
      name: 'OwnershipTransferred',
      type: 'event'
    },
    {
      inputs: [],
      name: 'WETH',
      outputs: [{ internalType: 'address', name: '', type: 'address' }],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        { internalType: 'address', name: '_factory', type: 'address' },
        { internalType: 'address', name: '_router', type: 'address' }
      ],
      name: 'addDex',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
      name: 'dexList',
      outputs: [
        { internalType: 'address', name: 'factory', type: 'address' },
        { internalType: 'address', name: 'router', type: 'address' }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [],
      name: 'fee',
      outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [],
      name: 'feeAddress',
      outputs: [{ internalType: 'address', name: '', type: 'address' }],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [],
      name: 'owner',
      outputs: [{ internalType: 'address', name: '', type: 'address' }],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [{ internalType: 'uint256', name: '_index', type: 'uint256' }],
      name: 'removeDex',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    { inputs: [], name: 'renounceOwnership', outputs: [], stateMutability: 'nonpayable', type: 'function' },
    {
      inputs: [{ internalType: 'uint256', name: '_fee', type: 'uint256' }],
      name: 'setFee',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [{ internalType: 'address', name: '_feeAddress', type: 'address' }],
      name: 'setFeeAddress',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        { internalType: 'uint256[]', name: 'amounts', type: 'uint256[]' },
        { internalType: 'address', name: 'tokenOut', type: 'address' },
        { internalType: 'uint256', name: 'dexIndex', type: 'uint256' },
        { internalType: 'address[]', name: 'path_', type: 'address[]' }
      ],
      name: 'swapExactETHForTokensWithMultiDex',
      outputs: [{ internalType: 'uint256', name: 'amountOut', type: 'uint256' }],
      stateMutability: 'payable',
      type: 'function'
    },
    {
      inputs: [
        { internalType: 'uint256', name: 'dexIndex', type: 'uint256' },
        { internalType: 'address[]', name: 'path', type: 'address[]' }
      ],
      name: 'swapExactETHForTokensWithMultiHops',
      outputs: [{ internalType: 'uint256', name: 'amountOut', type: 'uint256' }],
      stateMutability: 'payable',
      type: 'function'
    },
    {
      inputs: [
        { internalType: 'uint256', name: 'dexIndex', type: 'uint256' },
        { internalType: 'address[]', name: 'path', type: 'address[]' },
        { internalType: 'uint256', name: 'amountIn', type: 'uint256' }
      ],
      name: 'swapExactTokensForETHWithMultiHops',
      outputs: [{ internalType: 'uint256', name: 'amountOut', type: 'uint256' }],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        { internalType: 'uint256[]', name: 'amounts', type: 'uint256[]' },
        { internalType: 'address', name: 'tokenIn', type: 'address' },
        { internalType: 'address', name: 'tokenOut', type: 'address' },
        { internalType: 'uint256', name: 'amountIn', type: 'uint256' },
        { internalType: 'uint256', name: 'dexIndex', type: 'uint256' },
        { internalType: 'address[]', name: 'path_', type: 'address[]' }
      ],
      name: 'swapExactTokensForTokensWithMultiDex',
      outputs: [{ internalType: 'uint256', name: 'amountOut', type: 'uint256' }],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        { internalType: 'uint256', name: 'dexIndex', type: 'uint256' },
        { internalType: 'address[]', name: 'path', type: 'address[]' },
        { internalType: 'uint256', name: 'amountIn', type: 'uint256' }
      ],
      name: 'swapExactTokensForTokensWithMultiHops',
      outputs: [{ internalType: 'uint256', name: 'amountOut', type: 'uint256' }],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        { internalType: 'uint256[]', name: 'amounts', type: 'uint256[]' },
        { internalType: 'address', name: 'tokenIn', type: 'address' },
        { internalType: 'uint256', name: 'amountIn', type: 'uint256' },
        { internalType: 'uint256', name: 'dexIndex', type: 'uint256' },
        { internalType: 'address[]', name: 'path_', type: 'address[]' }
      ],
      name: 'swapExactTokensforETHWithMultiDex',
      outputs: [{ internalType: 'uint256', name: 'amountOut', type: 'uint256' }],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [{ internalType: 'address', name: 'newOwner', type: 'address' }],
      name: 'transferOwnership',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    }
  ]
}
