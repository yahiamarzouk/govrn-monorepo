import { useState } from 'react';
import { GovrnSpinner, Select } from '@govrn/protocol-ui';
import { Stack, Button, Text, Progress } from '@chakra-ui/react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useUser } from '../contexts/UserContext';
import { editContributionFormValidation } from '../utils/validations';
import { BulkDaoAttributeFormValues } from '../types/forms';
import { useDaosList } from '../hooks/useDaosList';
import pluralize from 'pluralize';
import { useContributionUpdate } from '../hooks/useContributionUpdate';
import { UIContribution } from '@govrn/ui-types';

interface BulkDaoAttributeModalProps {
  contributions: UIContribution[];
}

const BulkDaoAttributeModal = ({
  contributions,
}: BulkDaoAttributeModalProps) => {
  const { userData } = useUser();
  const [attributing, setAttributing] = useState(false);
  const [currentAttribution] = useState(1);
  const localForm = useForm({
    mode: 'all',
    resolver: yupResolver(editContributionFormValidation),
  });

  const { handleSubmit, setValue } = localForm;

  const {
    mutateAsync: updateNewContribution,
    isLoading: updateNewContributionIsLoading,
  } = useContributionUpdate();

  // renaming these on destructuring incase we have parallel queries:
  const {
    isLoading: daosListIsLoading,
    isError: daosListIsError,
    data: daosListData,
  } = useDaosList({
    where: { users: { some: { user_id: { equals: userData?.id } } } }, // show only user's DAOs
  });

  const daoListOptions =
    daosListData?.map(dao => ({
      value: dao.id,
      label: dao.name ?? '',
    })) || [];

  const daoReset = [
    {
      value: null,
      label: 'No DAO',
    },
  ];

  const combinedDaoListOptions = [...new Set([...daoReset, ...daoListOptions])];

  const bulkAttributeDaoHandler: SubmitHandler<
    BulkDaoAttributeFormValues
  > = async values => {
    setAttributing(true);
    contributions.map(contribution => {
      updateNewContribution({
        updatedValues: values,
        contribution: contribution,
        bulkItemCount: contributions.length,
      });
      return true;
    });
    setAttributing(false);
  };

  // the loading and fetching states from the query are true:
  if (daosListIsLoading) {
    return <GovrnSpinner />;
  }

  if (daosListIsError) {
    return <Text>An error occurred fetching DAOs.</Text>;
  }

  return (
    <Stack spacing="4" width="100%" color="gray.800">
      <form onSubmit={handleSubmit(bulkAttributeDaoHandler)}>
        <Text paddingBottom={2}>
          Attributing {pluralize('Contribution', contributions.length, true)}
        </Text>
        {attributing ? (
          <Progress
            color="brand.primary"
            value={currentAttribution % contributions.length}
          />
        ) : null}

        <Select
          name="daoId"
          label="DAO"
          tip={
            <>
              Please select a DAO to attribute to. This is optional. Dont see
              your DAO? Request to add it{' '}
              <a
                href="https://airtable.com/shrOedOjQpH9xlg7l"
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'underline' }}
              >
                here
              </a>
            </>
          }
          placeholder="Select a DAO to attribute to."
          onChange={dao => {
            setValue('daoId', dao.value);
          }}
          options={combinedDaoListOptions}
          localForm={localForm}
        />
        <Button
          variant="primary"
          type="submit"
          isLoading={attributing || updateNewContributionIsLoading}
        >
          Attribute {pluralize('Contribution', contributions.length)}
        </Button>
      </form>
    </Stack>
  );
};

export default BulkDaoAttributeModal;
