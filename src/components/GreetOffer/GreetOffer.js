// @flow
import * as React from 'react';
import { Wrapper } from '../../Layout';
import EmptyStateParagraph from '../../EmptyState/EmptyStateParagraph';

type Props = {
  title: string,
  bodyText: string,
}

const GreetOffer = (props: Props) => {
  const {
    title,
    bodyText,
  } = props;

  return (
    <Wrapper
      fullScreen
      style={{
        paddingTop: 90,
        paddingBottom: 90,
        alignItems: 'center',
      }}
    >
      <EmptyStateParagraph
        title={title}
        bodyText={bodyText}
      />
    </Wrapper>
  );
};

export default GreetOffer;
