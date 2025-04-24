import { useState, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import { Card, Typography, Button, Spin, message, Table, Tag } from "antd";
import BackgroundLogo from "../../components/Background";
import api from "../../components/fetch";

const { Title, Text } = Typography;

const PlayerResult = () => {
  const location = useLocation();
  const { playerid } = useParams();
  console.log("📦 Received location.state from PlayerGame:", location.state);
  const [loading, setLoading] = useState(true);
  const [formattedResults, setFormattedResults] = useState(null);
  //some value from palyerpage
  const {
    score,
    total,
    correctCount,
    playerName,
    totalScore: sumScore,
  } = location.state || {};
  //map details
  const stateDetails = (location.state?.details || []).reduce(
    (map, item, index) => {
      map[index] = item?.score ?? 0;
      return map;
    },
    {}
  );
  //fetch result from api
  useEffect(() => {
    const fetchResults = async () => {
      if (!playerid) {
        console.log("No playerid found, using location state data");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await api.get(`/play/${playerid}/results`);
        console.log("response:", response);
        if (response && Array.isArray(response)) {
          const answeredQuestions = response.filter(
            (q) => q.answeredAt !== null
          );
          const answeredCount = answeredQuestions.length;
          const correctCount = response.filter(
            (q) => q.correct === true
          ).length;
          //format result
          const detailedResults = response.map((result, index) => {
            let timeSpent = "N/A";
            if (result.questionStartedAt && result.answeredAt) {
              const startTime = new Date(result.questionStartedAt);
              const endTime = new Date(result.answeredAt);
              timeSpent = ((endTime - startTime) / 1000).toFixed(1) + "s";
            }
            const backScore = result.correct ? 10 : 0;
            const scoreInState = stateDetails[index] ?? backScore;

            return {
              key: index,
              questionNumber: index + 1,
              timeSpent: timeSpent,
              answerCount: result.answers ? result.answers.length : 0,
              score: scoreInState,
              status: result.correct
                ? "Correct"
                : result.answeredAt
                ? "Wrong"
                : "Not Answered",
              correct: result.correct,
            };
          });
          //save structure
          setFormattedResults({
            playerName,
            correctCount,
            answeredCount,
            total: response.length,
            score: totalScore,
            details: detailedResults,
          });
        } else {
          message.warning("Unexpected API response format");
        }
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch results:", error);
        message.error("Failed to load results. Using local data instead.");
        setLoading(false);
      }
    };
    fetchResults();
  }, [playerid, playerName]);
  // result table
  const columns = [
    {
      title: "Question",
      dataIndex: "questionNumber",
      key: "questionNumber",
    },
    {
      title: "Time Spent",
      dataIndex: "timeSpent",
      key: "timeSpent",
    },
    {
      title: "Choices",
      dataIndex: "answerCount",
      key: "answerCount",
    },
    {
      title: "Points",
      dataIndex: "score",
      key: "score",
      render: (score, record) => (
        <span
          style={{
            color: record.correct ? "#52c41a" : "#999",
            fontWeight: record.correct ? "bold" : "normal",
          }}
        >
          {record.correct ? score : 0}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status, record) => (
        <Tag
          color={
            record.correct
              ? "green"
              : status === "Not Answered"
              ? "gray"
              : "red"
          }
        >
          {status}
        </Tag>
      ),
    },
  ];

  //which data
  const displayData = formattedResults || {
    score,
    total,
    correctCount,
    playerName,
  };
  //cal score
  const calculateTotalScore = () => {
    if (formattedResults && formattedResults.details) {
      return formattedResults.details.reduce((total, item) => {
        return total + (item.correct ? (item.score > 0 ? item.score : 10) : 0);
      }, 0);
    }
    if (
      displayData.correctCount > 0 &&
      (!displayData.score || displayData.score <= 0)
    ) {
      return displayData.correctCount * 10;
    }
    return displayData.score || 0;
  };
  const totalScore = calculateTotalScore();
  //loading screen
  if (loading) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <BackgroundLogo />
        <Spin size="large" />
        <Typography.Text>Loading results...</Typography.Text>
      </div>
    );
  }
  return (
    <div
      style={{
        padding: "24px",
        maxWidth: "800px",
        margin: "0 auto",
        textAlign: "center",
      }}
    >
      <BackgroundLogo />
      <Card>
        <Title level={2}>🎉 Game Over</Title>
        <Text style={{ fontSize: "18px" }}>
          Congratulations {displayData.playerName ? displayData.playerName : ""}
          ! You&apos;ve completed the game!
        </Text>
        <div style={{ marginTop: "24px" }}>
          <Title level={3}>
            ✅ Total Correct: {displayData.correctCount} / {displayData.total}
          </Title>
          {/* total */}
          <Title level={4}>
            💯 Total Score: {totalScore}/{sumScore} points
          </Title>
          {formattedResults && (
            <Text>
              Questions Answered: {formattedResults.answeredCount} /{" "}
              {formattedResults.total}
            </Text>
          )}
        </div>
        {/* Table */}
        {formattedResults && formattedResults.details && (
          <div style={{ marginTop: "24px", textAlign: "left" }}>
            <Title level={4}>Answer Details:</Title>
            <Table
              columns={columns}
              dataSource={formattedResults.details}
              pagination={false}
              size="small"
              summary={() => (
                <Table.Summary>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={3}>
                      <strong>Total Points:</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} colSpan={2}>
                      <strong style={{ color: "#52c41a" }}>
                        {totalScore} points
                      </strong>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          </div>
        )}
        {/*refresh resultpage*/}
        <div style={{ marginTop: "24px" }}>
          {playerid && (
            <Button
              style={{ marginLeft: "10px" }}
              onClick={() => window.location.reload()}
            >
              Refresh Results
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PlayerResult;
