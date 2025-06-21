import React, { useState } from "react";
import "./FAQPage.css";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQPage: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const handleToggleAnswer = (index: number) => {
    setActiveIndex((prevIndex) => (prevIndex === index ? null : index));
  };

  const faqItems: FAQItem[] = [
    {
      question: "What is Iyare Learning Hub?",
      answer:
        "Iyare Learning Hub is an innovative education and skills development platform focused on empowering learners with practical and in-demand knowledge for success in today’s world.",
    },
    {
      question: "What courses or programs are offered?",
      answer:
        "We offer a variety of programs in tech, business, personal development, and youth empowerment—ranging from coding bootcamps and digital marketing to career readiness training.",
    },
    {
      question: "Is Iyare Learning Hub only for youths?",
      answer:
        "No. While we have youth-focused programs, we cater to all age groups, including adults seeking to reskill or upskill for personal or professional growth.",
    },
    {
      question: "How do I register for a program?",
      answer:
        "Visit our website and navigate to the 'Courses' section to browse programs and register online. You can also contact us directly for guidance.",
    },
    {
      question: "Is there a physical center?",
      answer:
        "Yes. We operate both online and at our physical learning center. Please check our contact page for the latest address and office hours.",
    },
    {
      question: "Can organizations partner with Iyare Learning Hub?",
      answer:
        "Absolutely. We welcome collaboration with schools, NGOs, and corporate organizations to deliver training, workshops, or community initiatives.",
    },
    {
      question: "How can I contact Iyare Learning Hub?",
      answer:
        "You can reach us via email at info@iyarehub.org or call +234 812 345 6789. You can also follow us on social media or visit our website at iyarehub.org.",
    },
  ];

  return (
    <div style={{ backgroundColor: "#fff" }}>
      <div className="faq-container">
        <h1 className="faq-header">Frequently Asked Questions</h1>
        <p className="faq-subtext">
          Here are answers to common questions about Iyare Learning Hub. Still
          have more? Contact us directly!
        </p>

        {faqItems.map((faq, index) => (
          <div
            key={index}
            className={`faq-item ${activeIndex === index ? "active" : ""}`}
          >
            <div
              className="faq-question"
              onClick={() => handleToggleAnswer(index)}
              aria-expanded={activeIndex === index}
            >
              <h3 className="faq-title">{faq.question}</h3>
              <span
                style={{
                  marginLeft: 12,
                  // backgroundColor: "#023009",
                  // border: "1px solid #023009",
                  // borderRadius: "50%",
                  //padding: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: `var(--dark-green)`,
                }}
              >
                {activeIndex === index ? (
                  <FaChevronUp size={16} />
                ) : (
                  <FaChevronDown size={16} />
                )}
              </span>
            </div>

            {activeIndex === index && (
              <div className="faq-answer">
                {faq.answer.split("\n").map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQPage;
