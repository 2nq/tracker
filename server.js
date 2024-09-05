const express = require('express');
const app = express();
app.use(express.json());

// Rotas para a API
let gains = [];

// Endpoint para a rota principal (raiz)
app.get('/', (req, res) => {
  res.send('Bem-vindo ao servidor Finance Tracker API');
});

// Endpoint para obter ganhos
app.get('/api/gains', (req, res) => {
  res.json(gains);
});

// Endpoint para adicionar ganhos
app.post('/api/gains', (req, res) => {
  const { amount, date } = req.body;

  if (!amount || !date) {
    return res.status(400).json({ message: 'Amount and date are required' });
  }

  const newGain = {
    _id: new Date().getTime().toString(),
    amount,
    date
  };

  gains.push(newGain);
  res.json(newGain);
});

// Endpoint para remover ganho
app.delete('/api/gains/:id', (req, res) => {
  const gainId = req.params.id;
  const gainIndex = gains.findIndex(gain => gain._id === gainId);

  if (gainIndex === -1) {
    return res.status(404).json({ message: 'Gain not found' });
  }

  const removedGain = gains.splice(gainIndex, 1);
  res.json(removedGain);
});

// Iniciar o servidor na porta 5000
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
