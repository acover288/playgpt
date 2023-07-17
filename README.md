# PlayGPT

This is a Next.js project that implements a chat interface using the OpenAI GPT-4 Chat API. The application allows users to have interactive conversations with the AI assistant powered by OpenAI. 

**Use at your own risk.**

## Prerequisites

Before running this project, you need to have the following:

- Node.js installed on your machine
- An API key from OpenAI

## Getting Started

Follow the steps below to run the project:

1. Clone the repository to your local machine.

2. Install the project dependencies by running the following command:

   ```
   npm install
   ```

3. Rename the `.env.example` file to `.env.local` and replace the placeholder value with your OpenAI API key.

4. Start the development server by running the following command:

   ```
   npm run dev
   ```

5. Open your web browser and navigate to `http://localhost:3000` to access the chat application.

## Usage

The chat application provides a user interface where you can enter messages and receive responses from the AI assistant. You can type your message in the input area and click the "Send" button or press "Ctrl+Enter" to send the message. The assistant will then provide a response based on the input.

You can also define custom functions for the AI assistant by typing the function definition in the second input area. The application supports copying and pasting code snippets, and it provides syntax highlighting for better readability.

The total cost of API usage is displayed at the top of the page, allowing you to keep track of the usage and associated cost.

## Customization

### Model Selection

The application supports two model options: GPT-3.5 Turbo and GPT-4. You can select the desired model from the drop-down menu on the page. If you need to add more model options, you can modify the `modelOptions` array in the code.

### Styling

The application uses a basic styling approach with Tailwind CSS utility classes. You can customize the styles by modifying the corresponding CSS classes in the code.

## License

This project is licensed under the [MIT License](LICENSE).

## Acknowledgments

The chat application is built using Next.js and utilizes the OpenAI GPT-4 Chat API. Special thanks to the developers of React, OpenAI, and the various libraries used in this project.

If you have any questions or feedback, please feel free to contact me. Enjoy chatting with the AI assistant!