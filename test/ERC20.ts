import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { expect } from 'chai'
import hre, { ethers } from 'hardhat'

async function getPermitSignature(
  wallet: any,
  token: any,
  spender: string,
  value: any,
  deadline: any
) {
  const [nonce, name, version, chainId] = await Promise.all([
    token.nonces(wallet.address),
    token.name(),
    '1',
    wallet.getChainId()
  ])

  return ethers.Signature.from(
    await wallet.signTypedData(
      {
        name,
        version,
        chainId,
        verifyingContract: await token.address()
      },
      {
        Permit: [
          {
            name: 'owner',
            type: 'address'
          },
          {
            name: 'spender',
            type: 'address'
          },
          {
            name: 'value',
            type: 'uint256'
          },
          {
            name: 'nonce',
            type: 'uint256'
          },
          {
            name: 'deadline',
            type: 'uint256'
          }
        ]
      },
      {
        owner: wallet.address,
        spender,
        value,
        nonce,
        deadline
      }
    )
  )
}

describe('ERC20Permit deployment', function () {
  async function deployERC20Permit() {
    const [owner] = await hre.ethers.getSigners()

    const Token = await hre.ethers.getContractFactory('Token')
    const token = await Token.deploy()

    const ERC20Permit = await hre.ethers.getContractFactory('ERC20Permit')
    const erc20Permit = await ERC20Permit.deploy(token.getAddress())

    const amount = ethers.parseUnits('10000', 18) // Use parseUnits for proper decimals

    await token.mint(owner.address, amount)

    const deadline = ethers.MaxUint256 // Updated for ethers v6

    const { v, r, s } = await getPermitSignature(
      owner,
      token,
      await erc20Permit.getAddress(),
      amount,
      deadline
    )

    // Complete the deposit with permit
    await erc20Permit.depositWithPermit(amount, deadline, v, r, s)

    return { erc20Permit, owner, token, amount }
  }

  it('Should deploy ERC20Permit contract', async function () {
    const { erc20Permit, token } = await loadFixture(deployERC20Permit)

    expect(await erc20Permit.token()).to.equal(await token.getAddress())
  })

  it('Should deposit tokens using permit', async function () {
    const { erc20Permit, owner, token, amount } = await loadFixture(deployERC20Permit)

    // Check that tokens were deposited
    expect(await erc20Permit.balanceOf(owner.address)).to.equal(amount)

    // Check that tokens were transferred from user to contract
    expect(await token.balanceOf(await erc20Permit.getAddress())).to.equal(amount)
  })

  it('Should handle permit signature correctly', async function () {
    const [owner] = await hre.ethers.getSigners()

    const Token = await hre.ethers.getContractFactory('Token')
    const token = await Token.deploy()

    const ERC20Permit = await hre.ethers.getContractFactory('ERC20Permit')
    const erc20Permit = await ERC20Permit.deploy(await token.getAddress())

    const amount = ethers.parseUnits('5000', 18)
    await token.mint(owner.address, amount)

    const deadline = Math.floor(Date.now() / 1000) + 3600 // 1 hour from now

    const { v, r, s } = await getPermitSignature(
      owner,
      token,
      await erc20Permit.getAddress(),
      amount,
      deadline
    )

    // Should not revert with valid permit
    await expect(erc20Permit.depositWithPermit(amount, deadline, v, r, s)).to.not.be.reverted
  })

  it('Should reject expired permit', async function () {
    const [owner] = await hre.ethers.getSigners()

    const Token = await hre.ethers.getContractFactory('Token')
    const token = await Token.deploy()

    const ERC20Permit = await hre.ethers.getContractFactory('ERC20Permit')
    const erc20Permit = await ERC20Permit.deploy(await token.getAddress())

    const amount = ethers.parseUnits('5000', 18)
    await token.mint(owner.address, amount)

    const deadline = Math.floor(Date.now() / 1000) - 3600 // 1 hour ago (expired)

    const { v, r, s } = await getPermitSignature(
      owner,
      token,
      await erc20Permit.getAddress(),
      amount,
      deadline
    )

    // Should revert with expired permit
    await expect(erc20Permit.depositWithPermit(amount, deadline, v, r, s)).to.be.reverted
  })
})
