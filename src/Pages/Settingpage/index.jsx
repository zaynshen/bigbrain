import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Form,
  Input,
  Card,
  Button,
  Select,
  InputNumber,
  message,
  Space,
  Row,
  Col,
  Switch,
} from "antd";
import api from "../../components/fetch";
import BackgroundLogo from "../../components/Background";
import {
  ArrowLeftOutlined,
  PlusOutlined,
  MinusCircleOutlined,
} from "@ant-design/icons";

const { Option } = Select;
//all layout
const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 4 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 20 },
  },
};

const Settingpage = () => {
  const { game_id, question_id } = useParams();
  const location = useLocation();
  const [form] = Form.useForm();
  const nav = useNavigate();
  const [answers, setanswers] = useState([]);
  const [questionType, setQuestionType] = useState("Single Choice");
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  //initial
  useEffect(() => {
    if (location.state) {
      console.log("Location state:", location.state);
      let initialAnswers = location.state.answers || ["Option 1", "Option 2"];
      let initialCorrectAnswers = location.state.correctAnswers || [];
      //if array
      if (
        Array.isArray(initialAnswers) &&
        initialAnswers.length > 0 &&
        typeof initialAnswers[0] === "object"
      ) {
        initialCorrectAnswers = initialAnswers.map((item) => !!item.isCorrect);
        initialAnswers = initialAnswers.map((item) => item.answer || "");
      }
      const initialType = location.state.type || "Single Choice";
      const initialScore = location.state.score || 0;
      const initialDuration = location.state.duration || 0;
      const finalAnswers =
        initialType === "Judgment" ? ["True", "False"] : initialAnswers;
      //set initial value
      form.setFieldsValue({
        question: location.state.question,
        type: initialType,
        answers: finalAnswers,
        correctAnswers: initialCorrectAnswers,
        score: initialScore,
        duration: initialDuration,
      });
      //async status
      setanswers(finalAnswers);
      setQuestionType(initialType);
      setSelectedAnswers(initialCorrectAnswers);
    }
  }, [location.state, form]);
  // change value
  const onValuesChange = (changedValues, allValues) => {
    if (changedValues.type) {
      const newType = changedValues.type;
      setQuestionType(newType);
      form.resetFields(["answers", "correctAnswers"]);
      //refre
      const defaultanswers =
        newType === "Judgment" ? ["True", "False"] : ["Option 1", "Option 2"];
      form.setFieldsValue({
        answers: defaultanswers,
        correctAnswers: [],
      });
      setanswers(defaultanswers);
      setSelectedAnswers([]);
    }
    if (changedValues.answers) {
      setanswers(allValues.answers);
    }
    if (changedValues.correctAnswers) {
      setSelectedAnswers(allValues.correctAnswers);
    }
  };
  //switch change
  const handleSwitchChange = (checked, index) => {
    const currentAnswers = form.getFieldValue("correctAnswers") || [];
    const newAnswers = [...currentAnswers];
    //ensure length same
    while (newAnswers.length < answers.length) {
      newAnswers.push(false);
    }
    const type = form.getFieldValue("type");
    if ((type === "Judgment" || type === "Single Choice") && checked) {
      //judgemnt and single only one true
      for (let i = 0; i < newAnswers.length; i++) {
        newAnswers[i] = false;
      }
      newAnswers[index] = true;
    } else {
      newAnswers[index] = checked;
    }
    form.setFieldsValue({ correctAnswers: newAnswers });
    setSelectedAnswers(newAnswers);
  };
  //define valid rule
  const validateAnswers = (_, value) => {
    const type = form.getFieldValue("type");
    if (!value || value.length === 0) {
      return Promise.reject(
        new Error("Please select at least one correct answer")
      );
    }
    const selectedCount = value.filter(Boolean).length;
    if (type === "Judgment" || type === "Single Choice") {
      if (selectedCount !== 1) {
        return Promise.reject(
          new Error(
            `Please select exactly one answer for ${type.toLowerCase()} questions`
          )
        );
      }
    } else if (type === "Multiple Selection") {
      if (selectedCount < 2) {
        return Promise.reject(
          new Error(
            "Please select at least two answers for multiple choice questions"
          )
        );
      }
    }

    return Promise.resolve();
  };
  //save setting
  const handleSave = async () => {
    try {
      await form.validateFields();
      const values = form.getFieldsValue();
      console.log("Form values:", values);
      const type = values.type;
      const answers = values.answers || [];
      let correctAnswers = [...(values.correctAnswers || [])];
      //must boolean
      correctAnswers = correctAnswers.map((answer) =>
        answer === undefined ? false : answer === true
      );
      while (correctAnswers.length < answers.length) {
        correctAnswers.push(false);
      }
      const score = values.score || 0;
      const duration = values.duration || 0;
      //check again
      if (type === "Judgment" && correctAnswers.filter(Boolean).length !== 1) {
        message.error(
          "Please select exactly one answer for judgment questions"
        );
        return;
      }
      if (
        type === "Single Choice" &&
        correctAnswers.filter(Boolean).length !== 1
      ) {
        message.error(
          "Please select exactly one answer for single choice questions"
        );
        return;
      }
      if (
        type === "Multiple Selection" &&
        correctAnswers.filter(Boolean).length < 2
      ) {
        message.error(
          "Please select at least two answers for multiple choice questions"
        );
        return;
      }
      const res = await api.get("/admin/games");
      const games = res.games;
      const currentGame = games.find((game) => game.id === parseInt(game_id));

      if (!currentGame) {
        message.error("Game not found");
        return;
      }
      const correctAnswerIndices = [];
      correctAnswers.forEach((isCorrect, index) => {
        if (isCorrect) {
          correctAnswerIndices.push(index);
        }
      });
      const formattedAnswers = answers.map((answer, index) => ({
        answer: answer,
        isCorrect: correctAnswers[index] || false,
      }));

      console.log("Saving to database:", {
        formattedAnswers,
        correctAnswerIndices,
      });

      const updatedQuestions = currentGame.questions.map((q) => {
        if (q.id === parseInt(question_id)) {
          return {
            ...q,
            question: values.question,
            type: values.type,
            answers: formattedAnswers,
            correctAnswers: correctAnswerIndices,
            score: score,
            duration: duration,
            optionCount: answers.length,
          };
        }
        return q;
      });
      const updatedGames = games.map((g) => {
        if (g.id === parseInt(game_id)) {
          return {
            ...g,
            questions: updatedQuestions,
          };
        }
        return g;
      });
      await api.put("/admin/games", { games: updatedGames });
      message.success("Changes saved successfully!");
      //if cancle
      nav(-1, {
        state: {
          question: values.question,
          type: values.type,
          answers: answers,
          correctAnswers: correctAnswers,
          score: score,
          duration: duration,
          optionCount: answers.length,
          formattedAnswers: formattedAnswers,
        },
      });
    } catch (error) {
      console.error("Save error:", error);
      if (error.errorFields) {
        error.errorFields.forEach((field) => {
          message.error(field.errors[0]);
        });
      } else {
        message.error("Failed to save changes: " + error.message);
      }
    }
  };
  return (
    <div style={{ padding: "24px" }}>
      <BackgroundLogo />

      <div style={{ marginBottom: "24px" }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => nav(-1)}
          style={{ color: "#af1441" }}
        >
          Back
        </Button>
      </div>

      <Card
        title="Question Settings"
        style={{ maxWidth: 800, margin: "0 auto", marginBottom: "24px" }}
      >
        <Form
          form={form}
          layout="vertical"
          onValuesChange={onValuesChange}
          key={questionType}
        >
          <Space direction="vertical" style={{ width: "100%" }}>
            <Form.Item
              name="question"
              label="Question Text"
              rules={[
                { required: true, message: "Please enter question text" },
                {
                  validator: (_, value) => {
                    if (!value || value.trim() === "") {
                      return Promise.reject(
                        "Title cannot be empty or only spaces"
                      );
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input.TextArea rows={4} />
            </Form.Item>

            <Form.Item
              name="type"
              label="Question Type"
              rules={[
                { required: true, message: "Please select question type" },
              ]}
            >
              <Select>
                <Option value="Single Choice">Single Choice Question</Option>
                <Option value="Multiple Selection">
                  Multiple Selection Question
                </Option>
                <Option value="Judgment">Judgment Question</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="score"
              label="Score"
              rules={[{ required: true, type: "number", min: 0, max: 99 }]}
            >
              <InputNumber style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              name="duration"
              label="Time Limit (seconds)"
              rules={[{ required: true, type: "number", min: 5, max: 60 }]}
            >
              <InputNumber style={{ width: "100%" }} />
            </Form.Item>
          </Space>
          {/* Answer Settings */}

          {questionType === "Judgment" ? (
            <Form.List name="answers" initialValue={["True", "False"]}>
              {(fields) => (
                <>
                  {fields.map((field, index) => (
                    <Form.Item
                      {...formItemLayout}
                      label={index === 0 ? "Answers" : ""}
                      required={true}
                      key={field.key}
                      style={{ marginBottom: 16 }}
                    >
                      <Row gutter={8} align="middle">
                        <Col span={16}>
                          <Form.Item
                            name={field.name}
                            fieldKey={field.fieldKey}
                            noStyle
                          >
                            <Input
                              value={index === 0 ? "True" : "False"}
                              disabled
                            />
                          </Form.Item>
                        </Col>
                        <Col span={4} style={{ textAlign: "center" }}>
                          <Form.Item
                            name={["correctAnswers", index]}
                            valuePropName="checked"
                            noStyle
                          >
                            <Switch
                              onChange={(checked) =>
                                handleSwitchChange(checked, index)
                              }
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Form.Item>
                  ))}
                </>
              )}
            </Form.List>
          ) : (
            <Form.List
              name="answers"
              initialValue={["Option 1", "Option 2"]}
              rules={[
                {
                  validator: async (_, answers) => {
                    if (!answers || answers.length < 2) {
                      return Promise.reject(
                        new Error("At least 2 answers are required")
                      );
                    }
                  },
                },
              ]}
            >
              {(fields, { add, remove }, { errors }) => (
                <>
                  {fields.map((field, index) => (
                    <Form.Item
                      {...formItemLayout}
                      label={index === 0 ? "Answers" : ""}
                      required={true}
                      key={field.key}
                      style={{ marginBottom: 16 }}
                    >
                      <Row gutter={8} align="middle">
                        <Col span={16}>
                          <Form.Item
                            name={field.name}
                            fieldKey={field.fieldKey}
                            validateTrigger={["onChange", "onBlur"]}
                            rules={[
                              {
                                required: true,
                                whitespace: true,
                                message:
                                  "Please input option text or delete this field.",
                              },
                            ]}
                            noStyle
                          >
                            <Input placeholder={`Option ${index + 1}`} />
                          </Form.Item>
                        </Col>
                        <Col span={4} style={{ textAlign: "center" }}>
                          <Form.Item noStyle>
                            <Switch
                              checked={
                                form.getFieldValue("correctAnswers")?.[index] ||
                                false
                              }
                              onChange={(checked) =>
                                handleSwitchChange(checked, index)
                              }
                            />
                          </Form.Item>
                        </Col>
                        <Col span={4} style={{ textAlign: "right" }}>
                          {fields.length > 2 && (
                            <MinusCircleOutlined
                              className="dynamic-delete-button"
                              onClick={() => remove(field.name)}
                              style={{
                                fontSize: "16px",
                                color: "#ff4d4f",
                                marginTop: 4,
                              }}
                            />
                          )}
                        </Col>
                      </Row>
                    </Form.Item>
                  ))}
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<PlusOutlined />}
                      disabled={fields.length >= 6}
                    >
                      Add Option
                    </Button>
                    <Form.ErrorList errors={errors} />
                  </Form.Item>
                </>
              )}
            </Form.List>
          )}

          <Form.Item
            name="correctAnswers"
            label="Correct Answer(s)"
            rules={[
              { required: true, message: "Please select correct answer(s)" },
              { validator: validateAnswers },
            ]}
          >
            <div style={{ color: "rgba(0, 0, 0, 0.45)" }}>
              {questionType === "Judgment"
                ? "Please select True or False"
                : questionType === "Multiple Selection"
                  ? "Please select at least 2 correct answers"
                  : "Please select exactly 1 correct answer"}
              <div style={{ marginTop: 8 }}>
                {selectedAnswers.length > 0 && (
                  <span style={{ color: "#52c41a" }}>
                    Selected:{" "}
                    {selectedAnswers
                      .map((isSelected, index) =>
                        isSelected
                          ? questionType === "Judgment"
                            ? index === 0
                              ? "True"
                              : "False"
                            : answers[index]
                          : null
                      )
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                )}
              </div>
            </div>
          </Form.Item>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button onClick={() => nav(-1)}>Cancel</Button>
            <Button type="primary" onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Settingpage;
