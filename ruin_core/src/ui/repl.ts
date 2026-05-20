import enquirer from 'enquirer';
const { prompt } = enquirer;

export async function askUserInput(): Promise<string> {
    const response: { userInput: string } = await prompt({
        type: 'input',
        name: 'userInput',
        message: 'You:'
    });
    return response.userInput;
}