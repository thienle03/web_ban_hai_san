const Seller=require('../models/seller');
const express=require('express');
const router=express.Router();
router.post('/', async (req, res) => {
    try {
        const { name, password } = req.body;
        const newSeller = new Seller({ name, password });
        await newSeller.save();
        res.status(201).json({ message: 'Seller added successfully', seller: newSeller });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});
