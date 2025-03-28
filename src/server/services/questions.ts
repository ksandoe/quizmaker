import OpenAI from 'openai';
import { supabase } from '../utils/database';
import type { NewQuestion } from '../../utils/supabase';

// Check for OpenAI API key at startup
if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is not set in environment variables');
  throw new Error('OpenAI API key is required');
}

console.log('Initializing OpenAI client with API key length:', process.env.OPENAI_API_KEY.length);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateQuestionForSegment(segmentId: string, content: string, creatorId: string): Promise<void> {
  try {
    console.log('Generating question for segment:', { 
      segmentId, 
      contentLength: content.length,
      hasApiKey: !!process.env.OPENAI_API_KEY,
      apiKeyLength: process.env.OPENAI_API_KEY?.length
    });

    // First check if a question already exists for this segment
    const { data: existingQuestion } = await supabase
      .from('questions')
      .select('question_id')
      .eq('segment_id', segmentId)
      .single();

    if (existingQuestion) {
      console.log('Question already exists for segment:', segmentId);
      return;
    }

    const prompt = `Generate a multiple choice question based on this text. The question should test understanding of key concepts. Format your response exactly like this example:
Q: What is the capital of France?
A: Paris
B: London
C: Berlin
D: Madrid
CORRECT: A

Here's the text to generate a question from:
${content}`;

    console.log('Sending request to OpenAI...');
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that generates multiple choice questions. Always follow the exact format specified.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    console.log('Received response from OpenAI');
    const result = response.choices[0]?.message?.content;
    if (!result) {
      throw new Error('No response from OpenAI');
    }

    // Parse the response
    const lines = result.split('\n');
    const questionMatch = lines[0].match(/^Q: (.+)$/);
    const optionAMatch = lines[1].match(/^A: (.+)$/);
    const optionBMatch = lines[2].match(/^B: (.+)$/);
    const optionCMatch = lines[3].match(/^C: (.+)$/);
    const optionDMatch = lines[4].match(/^D: (.+)$/);
    const correctMatch = lines[5].match(/^CORRECT: ([A-D])$/);

    if (!questionMatch || !optionAMatch || !optionBMatch || !optionCMatch || !optionDMatch || !correctMatch) {
      console.error('Invalid question format from OpenAI. Response:', result);
      throw new Error('Invalid question format from OpenAI');
    }

    const question: NewQuestion = {
      segment_id: segmentId,
      question_text: questionMatch[1],
      option_a: optionAMatch[1],
      option_b: optionBMatch[1],
      option_c: optionCMatch[1],
      option_d: optionDMatch[1],
      correct_answer: correctMatch[1],
      creator_id: creatorId,
      status: 'active'
    };

    console.log('Storing question:', {
      segmentId,
      questionText: question.question_text,
      correctAnswer: question.correct_answer
    });

    // Store the question
    const { error } = await supabase
      .from('questions')
      .insert([question]);

    if (error) {
      throw error;
    }

    // Update segment status
    const { error: updateError } = await supabase
      .from('segments')
      .update({ status: 'completed' })
      .eq('segment_id', segmentId)
      .eq('creator_id', creatorId);

    if (updateError) {
      console.error('Error updating segment status:', updateError);
    }

    console.log('Successfully generated and stored question for segment:', segmentId);

  } catch (error) {
    console.error('Error generating question:', error);

    // Update segment status to error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error generating question';
    
    const { error: updateError } = await supabase
      .from('segments')
      .update({ 
        status: 'error',
        error_message: errorMessage
      })
      .eq('segment_id', segmentId)
      .eq('creator_id', creatorId);

    if (updateError) {
      console.error('Error updating segment error status:', updateError);
    }

    throw error;
  }
}
