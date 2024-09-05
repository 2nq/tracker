const express = require('express');
const Gain = require('../models/Gain');
const router = express.Router();

// Adicionar um novo ganho
router.post('/', async (req, res) => {
    const { date, amount } = req.body;

    const newGain = new Gain({ date, amount });

    try {
        const savedGain = await newGain.save();
        res.json(savedGain);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Obter todos os ganhos agrupados por dia
router.get('/', async (req, res) => {
    try {
        const gains = await Gain.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    total: { $sum: "$amount" }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        res.json(gains);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
