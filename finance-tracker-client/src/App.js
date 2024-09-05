import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, startOfDay, startOfWeek, startOfMonth, isSameDay, isSameWeek, isSameMonth, getDay } from 'date-fns'; // Adicione getDay aqui
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import './App.css';

// Registrar os componentes necessários
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function App() {
  const [amount, setAmount] = useState('');
  const [gains, setGains] = useState([]);
  const [dailyTotal, setDailyTotal] = useState(0);
  const [weeklyTotal, setWeeklyTotal] = useState(0);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayType, setOverlayType] = useState(''); // 'weekly' ou 'monthly'

  // Função para buscar os ganhos
  useEffect(() => {
    axios.get('/api/gains')
      .then(response => {
        setGains(response.data);
        calculateTotals(response.data); // Calcular os totais quando os dados são carregados
      })
      .catch(error => console.log("Error fetching gains: ", error));
  }, []);

  // Função para calcular os totais diário, semanal e mensal
  const calculateTotals = (gains) => {
    const now = new Date();
    const startOfToday = startOfDay(now);
    const startOfWeekDate = startOfWeek(now, { weekStartsOn: 1 });
    const startOfMonthDate = startOfMonth(now);

    let dailySum = 0;
    let weeklySum = 0;
    let monthlySum = 0;

    gains.forEach(gain => {
      const gainDate = new Date(gain.date);
      if (isSameDay(gainDate, startOfToday)) {
        dailySum += gain.amount;
      }
      if (isSameWeek(gainDate, now, { weekStartsOn: 1 })) {
        weeklySum += gain.amount;
      }
      if (isSameMonth(gainDate, now)) {
        monthlySum += gain.amount;
      }
    });

    setDailyTotal(dailySum);
    setWeeklyTotal(weeklySum);
    setMonthlyTotal(monthlySum);
  };

  // Função para adicionar ganho
  const handleAddGain = (e) => {
    e.preventDefault();

    if (!amount || isNaN(amount)) {
      alert("Por favor, insira um montante válido.");
      return;
    }

    axios.post('/api/gains', { 
      amount: parseFloat(amount),  // Aceitar o valor como número decimal
      date: new Date().toISOString()
    })
      .then(response => {
        const newGains = [...gains, response.data];
        setGains(newGains);
        setAmount('');  // Limpar o campo após adicionar o montante
        calculateTotals(newGains); // Recalcular os totais ao adicionar novo ganho
      })
      .catch(error => {
        console.log("Error adding gain: ", error);
      });
  };

  // Função para remover ganho
  const handleRemoveGain = (id) => {
    axios.delete(`/api/gains/${id}`)
      .then(() => {
        const updatedGains = gains.filter(gain => gain._id !== id);
        setGains(updatedGains);
        calculateTotals(updatedGains); // Recalcular os totais ao remover ganho
      })
      .catch(error => {
        console.log("Error removing gain: ", error);
      });
  };

  // Mostrar o overlay com o gráfico correspondente
  const openOverlay = (type) => {
    setOverlayType(type);
    setShowOverlay(true);
  };

  // Fechar o overlay
  const closeOverlay = () => {
    setShowOverlay(false);
  };

  // Função para agrupar os ganhos por dia da semana
  const getWeeklyData = () => {
    const weekDays = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo']; // Lowercase
    const weeklyData = Array(7).fill(0); // Inicializa um array para os dias da semana

    gains.forEach(gain => {
      const gainDate = new Date(gain.date);
      if (isSameWeek(gainDate, new Date(), { weekStartsOn: 1 })) {
        const dayOfWeek = getDay(gainDate); // Obtém o índice do dia da semana (0 = Domingo, 1 = Segunda...)
        weeklyData[dayOfWeek === 0 ? 6 : dayOfWeek - 1] += gain.amount; // Ajusta para começar em Segunda
      }
    });

    return {
      labels: weekDays,
      datasets: [
        {
          label: 'ganhos (€)', // Lowercase no label
          data: weeklyData,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  // Função para agrupar os ganhos por semana do mês
  const getMonthlyData = () => {
    const monthWeeks = ['1ª semana', '2ª semana', '3ª semana', '4ª semana']; // Lowercase
    const monthlyData = Array(4).fill(0); // Inicializa um array para as semanas do mês

    gains.forEach(gain => {
      const gainDate = new Date(gain.date);
      const now = new Date();
      if (isSameMonth(gainDate, now)) {
        const dayOfMonth = gainDate.getDate(); // Obtém o dia do mês
        let weekOfMonth;

        // Calcula a semana do mês com base no dia
        if (dayOfMonth <= 7) {
          weekOfMonth = 0; // Primeira semana
        } else if (dayOfMonth <= 14) {
          weekOfMonth = 1; // Segunda semana
        } else if (dayOfMonth <= 21) {
          weekOfMonth = 2; // Terceira semana
        } else {
          weekOfMonth = 3; // Quarta semana
        }

        monthlyData[weekOfMonth] += gain.amount; // Adiciona o ganho na semana correspondente
      }
    });

    return {
      labels: monthWeeks,
      datasets: [
        {
          label: 'ganhos (€)', // Lowercase no label
          data: monthlyData,
          backgroundColor: 'rgba(153, 102, 255, 0.6)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  return (
    <div className="background-container">
      <div className="app-container">
        <div className="container">
          <h1>Track Earnings</h1> 
          <form className="form" onSubmit={handleAddGain}>
            <input 
              type="number" 
              step="0.01" // Permitir valores decimais
              className="input"
              placeholder="adicionar montante"
              value={amount} 
              onChange={(e) => setAmount(e.target.value)}
            />
            <button type="submit" className="button button--primary">adicionar</button>
          </form>
          <h2>ganhos diários:</h2>
          <ul className="list">
            {gains.slice().reverse().map(gain => (
              <li key={gain._id} className="list__item">
                <div>
                  <span className="amount">€{gain.amount.toFixed(2)}</span> {/* Exibir com 2 casas decimais */}
                  <div className="date">{format(new Date(gain.date), 'dd/MM/yy')}</div>
                </div>
                <button className="button-remove" onClick={() => handleRemoveGain(gain._id)}>
                  &times;
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="totals-container">
          <div className="total-daily">
            <p>total diário</p>
            <span className="total-amount">€{dailyTotal.toFixed(2)}</span> {/* Exibir com 2 casas decimais */}
          </div>
          <hr className="divider" />
          <div className="total-weekly" onClick={() => openOverlay('weekly')}>
            <p>total semanal</p>
            <span className="total-amount">€{weeklyTotal.toFixed(2)}</span> {/* Exibir com 2 casas decimais */}
          </div>
          <hr className="divider" />
          <div className="total-monthly" onClick={() => openOverlay('monthly')}>
            <p>total mensal</p>
            <span className="total-amount">€{monthlyTotal.toFixed(2)}</span> {/* Exibir com 2 casas decimais */}
          </div>
        </div>
      </div>

      {showOverlay && (
        <div className="overlay">
          <div className="overlay-content">
            <button className="close-button" onClick={closeOverlay}>&times;</button>
            <h2>{overlayType === 'weekly' ? 'ganhos semanais' : 'ganhos mensais'}</h2>
            <Bar data={overlayType === 'weekly' ? getWeeklyData() : getMonthlyData()} />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;