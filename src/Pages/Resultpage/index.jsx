import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Typography, Table, Button, message, Spin } from "antd";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts";
import api from "../../components/fetch";
import { ArrowLeftOutlined } from "@ant-design/icons";

const { Title } = Typography;

const Resultpage = () => {
  const { sessionId } = useParams();
  const [loading, setLoading] = useState(true);
  const [topPlayers, setTopPlayers] = useState([]);
  const [questionStats, setQuestionStats] = useState([]);
  const [responseTimes, setResponseTimes] = useState([]);
  const navigate = useNavigate();
  //fetch result
  useEffect(() => {
    const fetchGameResults = async () => {
      try {
        const response = await api.get(`/admin/session/${sessionId}/results`);
        console.log("Game results:", response);
        //check result
        if (response && response.results?.length > 0) {
          const players = response.results || [];
          //cal result from player
          const scoredPlayers = players.map((p, idx) => {
            const correctAnswers = p.answers.filter((a) => a.correct).length;
            return {
              key: p.name || idx,
              name: p.name,
              correctAnswers,
              averageTime: getAverageTime(p.answers),
            };
          });
          //rank palyer
          const sortedPlayers = [...scoredPlayers]
            .sort((a, b) => b.correctAnswers - a.correctAnswers)
            .slice(0, 5);
          setTopPlayers(sortedPlayers);
          //acc
          const numQuestions = players[0]?.answers?.length || 0;
          const stats = Array.from({ length: numQuestions }, (_, index) => {
            const totalAttempts = players.length;
            const correctCount = players.filter(
              (p) => p.answers[index]?.correct
            ).length;
            return {
              question: `Q${index + 1}`,
              correctCount,
              totalAttempts,
              accuracy: (correctCount / totalAttempts) * 100,
            };
          });
          setQuestionStats(stats);
          //cal time
          const times = Array.from({ length: numQuestions }, (_, index) => {
            const durations = players
              .map((p) => {
                const ans = p.answers[index];
                if (ans?.questionStartedAt && ans?.answeredAt) {
                  const start = new Date(ans.questionStartedAt).getTime();
                  const end = new Date(ans.answeredAt).getTime();
                  return (end - start) / 1000;
                }
                return null;
              })
              .filter((d) => d !== null);
            const average =
              durations.reduce((sum, t) => sum + t, 0) / durations.length || 0;
            const min = durations.length ? Math.min(...durations) : 0;
            const max = durations.length ? Math.max(...durations) : 0;
            return {
              question: `Q${index + 1}`,
              averageTime: average,
              minTime: min,
              maxTime: max,
            };
          });
          setResponseTimes(times);
        }
      } catch (error) {
        console.error("Error fetching game results:", error);
        message.error("Failed to fetch game results");
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchGameResults();
    }
  }, [sessionId]);
  //cai average time
  const getAverageTime = (answers) => {
    const durations = answers
      .map((ans) => {
        if (ans?.questionStartedAt && ans?.answeredAt) {
          const start = new Date(ans.questionStartedAt).getTime();
          const end = new Date(ans.answeredAt).getTime();
          return (end - start) / 1000;
        }
        return null;
      })
      .filter((d) => d !== null);

    return durations.length
      ? durations.reduce((sum, t) => sum + t, 0) / durations.length
      : 0;
  };
  //result table
  const playerColumns = [
    {
      title: "Rank",
      dataIndex: "rank",
      key: "rank",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Player Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Correct Answers",
      dataIndex: "correctAnswers",
      key: "correctAnswers",
    },
    {
      title: "Response Time",
      dataIndex: "averageTime",
      key: "averageTime",
      render: (time) => `${time.toFixed(2)}s`,
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <Spin size="large" />
        <Typography.Text>Loading results...</Typography.Text>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate("/dashboard")}
        style={{ color: "#af1441" }}
      >
        BackToDashboard
      </Button>
      <Title level={2}>Game Results</Title>
      <Card title="Top Players" style={{ marginBottom: "24px" }}>
        <Table
          columns={playerColumns}
          dataSource={topPlayers}
          rowKey="key"
          pagination={false}
        />
      </Card>
      <Card title="Question Accuracy" style={{ marginBottom: "24px" }}>
        <BarChart
          width={800}
          height={400}
          data={questionStats}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="question" />
          <YAxis
            label={{
              value: "Accuracy (%)",
              angle: -90,
              position: "insideLeft",
            }}
          />
          <Tooltip
            formatter={(value) => [`${value.toFixed(2)}%`, "Accuracy"]}
            labelFormatter={(label) => `Question ${label}`}
          />
          <Legend />
          <Bar dataKey="accuracy" fill="#8884d8" name="Accuracy" />
        </BarChart>
      </Card>

      <Card title="Response Time Analysis" style={{ marginBottom: "24px" }}>
        <LineChart
          width={800}
          height={400}
          data={responseTimes}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="question" />
          <YAxis
            label={{
              value: "Time (seconds)",
              angle: -90,
              position: "insideLeft",
            }}
          />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="averageTime"
            stroke="#8884d8"
            name="Average Time"
          />
          <Line
            type="monotone"
            dataKey="minTime"
            stroke="#82ca9d"
            name="Minimum Time"
          />
          <Line
            type="monotone"
            dataKey="maxTime"
            stroke="#ffc658"
            name="Maximum Time"
          />
        </LineChart>
      </Card>
    </div>
  );
};

export default Resultpage;
