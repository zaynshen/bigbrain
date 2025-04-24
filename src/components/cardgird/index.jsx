import {
  EditOutlined,
  DeleteOutlined,
  QuestionCircleOutlined,
  PlayCircleOutlined,
  CopyOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { Container } from "@mui/material";
import {
  Avatar,
  Card,
  Empty,
  message,
  Modal,
  Popconfirm,
  Button,
  Typography,
} from "antd";
import { useState } from "react";
import api from "../../components/fetch";
const { Meta } = Card;
const CardGird = ({ games = [], onDelete }) => {
  const navigate = useNavigate();
  const [sessionModalVisible, setSessionModalVisible] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  //start game
  const handleStartGame = async (game) => {
    try {
      const res = await api.post(`/admin/game/${game.id}/mutate`, {
        mutationType: "START",
      });
      if (res.data && res.data.sessionId) {
        setActiveSession(res.data.sessionId);
        setSessionModalVisible(true);
        game.active = res.data.sessionId;
      }
    } catch (_error) {
      message.error("Start Game Failed!");
    }
  };
  //stop game
  const handleStopGame = async (game) => {
    try {
      await api.post(`/admin/game/${game.id}/mutate`, {
        mutationType: "END",
      });
      setActiveSession(game.active);
      game.active = null;
      setShowResultModal(true);
    } catch (_error) {
      message.error("Failed to end game");
    }
  };
  //copy link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(
      `${window.location.origin}/join/${activeSession}`
    );
    message.success("Link copied to clipboard");
  };
  const showResult = () => {
    navigate(`/session/${activeSession}/result`);
  };
  return (
    <>
      {games.length > 0 ? (
        <Container
          style={{
            display: "flex",
            gap: "20px",
            marginTop: "20px",
            flexWrap: "wrap",
          }}
        >
          {games.map((game) => (
            <Card
              key={game.id}
              style={{ width: 300 }}
              cover={<img alt="GameImage" src={game.thumbnail} />}
              actions={[
                game.active ? (
                  <StopOutlined
                    key="stop"
                    onClick={() => handleStopGame(game)}
                  />
                ) : (
                  <PlayCircleOutlined
                    key="start"
                    onClick={() => handleStartGame(game)}
                  />
                ),

                <EditOutlined
                  key="edit"
                  onClick={() => navigate(`/game/${game.id}`)}
                />,
                <Popconfirm
                  key="delete"
                  title="Delete the Game"
                  description="Are you sure to delete this Game?"
                  icon={<QuestionCircleOutlined style={{ color: "red" }} />}
                  onConfirm={() => onDelete?.(game.id)}
                  onCancel={() => {}}
                  okText="Yes"
                  cancelText="No"
                >
                  <DeleteOutlined />
                </Popconfirm>,
              ]}
            >
              <Meta
                avatar={<Avatar>{game.owner?.[0] || "U"}</Avatar>}
                title={game.name}
                description={
                  <div>
                    <p>{game.description}</p>
                    <p>Questions: {game.questions?.length || 0}</p>
                    <Button
                      type="link"
                      size="small"
                      onClick={() => navigate(`/play/${game.active}`)}
                    >
                      Enter Game
                    </Button>
                  </div>
                }
              />
            </Card>
          ))}
        </Container>
      ) : (
        <Empty
          description="No Game Yet, Create Now!"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}
      <Modal
        title="Game Session Started"
        open={sessionModalVisible}
        onCancel={() => setSessionModalVisible(false)}
        footer={[
          <Button key="copy" type="primary" onClick={handleCopyLink}>
            <CopyOutlined /> Copy Link
          </Button>,
          <Button key="close" onClick={() => setSessionModalVisible(false)}>
            Close
          </Button>,
        ]}
      >
        <Typography.Paragraph>Session ID: {activeSession}</Typography.Paragraph>
        <Typography.Paragraph>
          Share this link with players to join the game:
          <br />
          {`${window.location.origin}/join/${activeSession}`}
        </Typography.Paragraph>
      </Modal>
      <Modal
        title="Game Session Ended"
        open={showResultModal}
        onCancel={() => setShowResultModal(false)}
        footer={[
          <Button key="result" type="primary" onClick={showResult}>
            <CopyOutlined /> Show Result
          </Button>,
          <Button key="close" onClick={() => setShowResultModal(false)}>
            Close
          </Button>,
        ]}
      >
        <Typography.Paragraph>
          Game Session Ended, You can see the result here
        </Typography.Paragraph>
      </Modal>
    </>
  );
};
export default CardGird;
