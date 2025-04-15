import { Router } from 'express'
import { AppDataSource } from '../config/database'
import { Account } from '../entities/Account'

const router = Router()
const accountRepository = AppDataSource.getRepository(Account)

// GET all accounts
router.get('/', async (req, res) => {
  try {
    const accounts = await accountRepository.find()
    res.json(accounts)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching accounts' })
  }
})

// GET single account
router.get('/:id', async (req, res) => {
  try {
    const account = await accountRepository.findOneBy({ id: parseInt(req.params.id) })
    if (!account) {
      return res.status(404).json({ message: 'Account not found' })
    }
    res.json(account)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching account' })
  }
})

// POST new account
router.post('/', async (req, res) => {
  try {
    const account = accountRepository.create(req.body)
    const result = await accountRepository.save(account)
    res.status(201).json(result)
  } catch (error) {
    res.status(500).json({ message: 'Error creating account' })
  }
})

// PATCH update account
router.patch('/:id', async (req, res) => {
  try {
    const account = await accountRepository.findOneBy({ id: parseInt(req.params.id) })
    if (!account) {
      return res.status(404).json({ message: 'Account not found' })
    }
    accountRepository.merge(account, req.body)
    const result = await accountRepository.save(account)
    res.json(result)
  } catch (error) {
    res.status(500).json({ message: 'Error updating account' })
  }
})

// DELETE account
router.delete('/:id', async (req, res) => {
  try {
    const account = await accountRepository.findOneBy({ id: parseInt(req.params.id) })
    if (!account) {
      return res.status(404).json({ message: 'Account not found' })
    }
    await accountRepository.remove(account)
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ message: 'Error deleting account' })
  }
})

export default router 