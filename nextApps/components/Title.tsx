import * as React from 'react';

type Props = { text: string };

const Title: React.FC<Props> = ({ text }) => <h1>{text}</h1>;
export default Title;
