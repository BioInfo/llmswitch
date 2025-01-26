# LLMSwitch

A modern interface for comparing and analyzing responses from multiple Large Language Models. Made with ❤️ by [J&S Group, LLC](https://jsgroup.llc).

## Features

### Model Comparison
- Compare responses from multiple LLMs (Deepseek R1, Claude 3 Sonnet)
- Enhanced responses using combined reasoning approaches
- Structured comparative analysis of differences and similarities
- Six diverse prompt categories for testing different capabilities

### Interactive UI
- Clean, modern interface built with Next.js and Tailwind CSS
- Engaging loading states with AI-themed jokes
- Collapsible reasoning sections
- Responsive grid layouts
- Visual hierarchy with gradient accents

### Advanced Text Processing
- Intelligent handling of mathematical expressions
- Clean formatting of responses and analysis
- LaTeX conversion and normalization
- Smart spacing and paragraph structuring

### Comparative Analysis
- Automated analysis of response differences
- Structured evaluation of approaches
- Identification of unique strengths
- Effectiveness assessment

## Getting Started

### Prerequisites
- Node.js 18+
- API keys for:
  - Anthropic Claude
  - Deepseek

### Installation
1. Clone the repository:
```bash
git clone https://github.com/yourusername/llmswitch.git
cd llmswitch
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```
Add your API keys to `.env.local`

4. Run the development server:
```bash
npm run dev
```

## Usage

1. Select a prompt category from the comparison page
2. View responses from different models
3. Toggle reasoning sections for deeper insights
4. Explore the comparative analysis
5. Use the findings to understand model strengths and differences

## Technology Stack

- **Frontend**: Next.js 14+, React, TypeScript
- **Styling**: Tailwind CSS, ShadCN UI
- **State Management**: React hooks and context
- **APIs**: Claude 3 Sonnet, Deepseek R1

For more details, see:
- [Project Roadmap](docs/projectRoadmap.md)
- [Technical Documentation](docs/techStack.md)
- [Comparison Feature](docs/comparisonFeature.md)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- LLM providers:
  - [Anthropic Claude](https://www.anthropic.com/)
  - [Deepseek](https://deepseek.ai/)

## About J&S Group

LLMSwitch is developed and maintained by J&S Group, LLC, a technology company focused on building innovative AI tools and solutions. For more information, visit [our website](https://jsgroup.llc).
