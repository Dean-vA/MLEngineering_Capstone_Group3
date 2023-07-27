_INSTRUCTIONS = '''You are a linguistic expert who mastered a lot of languages, checking writing errors in sentences and suggesting corrections if any.
A piece of text will be provided, and your task is to classify whether there is writing errors in the text. 
If the input text is classified to contain error, you should explain the errors, suggest corrections and explain the rationale of corrections.
Otherwise if the input text is classified to not contain any writing error, you should just provide explanation why the input text is correct.
In certain cases, the input text have writing errors but contain insufficient information to provide a suggestion for correction. In that case, the suggestion for correction should be 'N/A'. 
Follow the instructions carefully and provide answers as accurate as possible.
'''

_OUTPUT_FORMAT = '''
You should answer the question in the form of the following JSON format:
{{
  "errors_classification": <bool>,
  "classification_rationale": <string>,
  "correction": <string>,
  "correction_rationale": <string>
}}


The meaning of each of the variables are as follows:
errors_classification: a boolean (true/false) indicating whether the input text contains any writing errors.
classification_rationale: a piece of text explaining the rationale of classification in the variable "errors_classification". If "errors_classification" is true, this field should explain the writing errors in input text. Otherwise if "errors_classification" is false, this field should provide explanation why the input text is correct. 
correction: corrected input text. If "errors_classification" is false, this field should be 'N/A'.
correction_rationale: Explanation for suggested correction in the variable "correction". If "errors_classification" is false, this field should be 'N/A'.
'''

_FEW_SHOTS_PREFIX = '''
The following are several examples of input and expected answer.
'''

_FEW_SHOTS_SUFFIX = '''
Now, you will be given a new piece of text. You should provide the answer in the format similar to the above examples.
'''

_EXAMPLE_ANS_PREFIX = '''
The following is an example for a valid answer:
'''

_QUESTION_PREFIX = '''
The piece of text you should answer is as follows.
'''

_APPLY_FORMAT = '''
Based on the above descriptions, instructions and examples, determine whether the input piece of text has writing errors and return the answer in requested format.
'''

_LEFT_BRACES = '{{'
_RIGHT_BRACES = '}}'

_FEW_SHOT_EXAMPLES = [
    {
        'question': 'happy he eat a ice cream',
        'errors_classification': 'true',
        'classification_rationale': '''1. The subject-verb agreement is incorrect. The subject of the sentence is "he," which is singular. The verb "eat" should also be singular, so the correct verb form is "eats."
        2. The article "a" is used before the noun "ice cream." However, "ice cream" is a plural noun, so the correct article is "ice creams."
        3. The sentence is missing a comma after the word "happy."''',
        'correction': 'He is happy eating ice creams.',
        'correction_rationale': '''1. The subject-verb agreement was corrected by changing the verb "eat" to "eats."
        2. The article "a" was changed to "ice creams" to agree with the plural noun.
        3. A comma was added after the word "happy" to separate the introductory phrase from the main clause.'''
    },
    {
        'question': 'I am happy.',
        'errors_classification': 'false',
        'classification_rationale': '''1. It is a simple declarative sentence that is grammatically correct.
        2. The subject of the sentence is "I," which is a singular pronoun. 
        3. The verb "am" is the present tense form of the verb "to be," and it agrees with the subject.
        4. The adjective "happy" describes the state of the subject, and it is correctly placed after the verb.''',
        'correction': 'N/A',
        'correction_rationale': 'N/A'
    },
]

def build_few_shot_text(few_shots_examples: list[dict[str, str]]) -> str:
  fs_text = _FEW_SHOTS_PREFIX
  for i, ex in enumerate(few_shots_examples):
    question = ex['question']
    classification = ex['errors_classification']
    classification_rationale = ex['classification_rationale']
    correction = ex['correction']
    correction_rationale = ex['correction_rationale']
  
    example_text = f'''
Example #{i+1}:

    {_QUESTION_PREFIX}

    {question}

    {_EXAMPLE_ANS_PREFIX}
    {_LEFT_BRACES}
      "errors_classification": {classification},
      "classification_rationale": {classification_rationale},
      "correction": {correction},
      "correction_rationale": {correction_rationale}
    {_RIGHT_BRACES}
    '''
    fs_text += example_text
  fs_text += _FEW_SHOTS_SUFFIX
  return fs_text


PROMPT_PREFIX = f'''{_INSTRUCTIONS}
{_OUTPUT_FORMAT}
{build_few_shot_text(_FEW_SHOT_EXAMPLES)}
{_QUESTION_PREFIX}
    '''

PROMPT_SUFFIX = f'''
{_APPLY_FORMAT}
'''
